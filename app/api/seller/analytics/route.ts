import { NextRequest, NextResponse } from "next/server";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";
import {
  ProductInteractionService,
  ShopInteractionService,
} from "@/lib/analytics";

export const dynamic = "force-dynamic";

/** Paid orders for this seller, excluding cancelled/refunded — same basis as `/api/seller/dashboard`. */
function paidOrderWhere(sellerUserId: string) {
  return {
    sellerId: sellerUserId,
    paymentStatus: PaymentStatus.PAID,
    status: {
      notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED],
    },
  };
}

export async function GET(request: NextRequest) {
  let session: { user?: { id?: string } } | null = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sellerIdParam = searchParams.get("sellerId");

    if (!sellerIdParam) {
      return NextResponse.json(
        { error: "Seller ID is required" },
        { status: 400 }
      );
    }

    const seller = await db.seller.findUnique({
      where: { userId: sellerIdParam },
      select: {
        id: true,
        userId: true,
        shopName: true,
        preferredCurrency: true,
      },
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    if (session.user.id !== sellerIdParam) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { admin: true },
      });
      if (!user?.admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const userId = seller.userId;
    const orderWhere = paidOrderWhere(userId);

    const [
      totalProductViews,
      totalShopViews,
      orderAggregate,
      ordersForTopSales,
      viewRows,
    ] = await Promise.all([
      ProductInteractionService.getSellerTotalViewCount(userId),
      ShopInteractionService.getShopViewCount(seller.id),
      db.order.aggregate({
        where: orderWhere,
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      db.order.findMany({
        where: orderWhere,
        select: {
          productId: true,
          productName: true,
          totalAmount: true,
        },
      }),
      ProductInteractionService.getSellerProductViewCounts(userId),
    ]);

    const totalOrders = orderAggregate._count._all;
    const totalRevenueCents = Math.round(orderAggregate._sum.totalAmount ?? 0);

    // Revenue per product for "top by sales" (paid orders only)
    const revenueByProduct = new Map<
      string,
      { productName: string; revenueCents: number }
    >();
    for (const o of ordersForTopSales) {
      const prev = revenueByProduct.get(o.productId);
      const add = Math.round(o.totalAmount);
      if (prev) {
        prev.revenueCents += add;
      } else {
        revenueByProduct.set(o.productId, {
          productName: o.productName,
          revenueCents: add,
        });
      }
    }

    const topProductsBySales = [...revenueByProduct.entries()]
      .map(([productId, v]) => ({
        productId,
        productName: v.productName,
        revenueCents: v.revenueCents,
      }))
      .sort((a, b) => b.revenueCents - a.revenueCents)
      .slice(0, 3);

    // Only products with at least one recorded view qualify as "top by views"
    const topProductsByViews = [...viewRows]
      .filter((r) => r.views > 0)
      .sort((a, b) => b.views - a.views)
      .slice(0, 3);

    return NextResponse.json({
      preferredCurrency: seller.preferredCurrency,
      totalProductViews,
      totalShopViews,
      totalOrders,
      totalRevenueCents,
      topProductsByViews,
      topProductsBySales,
    });
  } catch (error) {
    console.error("Error fetching seller analytics:", error);

    const userMessage = logError({
      code: "SELLER_ANALYTICS_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/analytics",
      method: "GET",
      error,
      metadata: { note: "Failed to fetch seller analytics" },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

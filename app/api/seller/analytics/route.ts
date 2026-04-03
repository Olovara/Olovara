import { NextRequest, NextResponse } from "next/server";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";
import {
  ProductInteractionService,
  ShopInteractionService,
} from "@/lib/analytics";
import {
  aggregateProductViewsByCountry,
  countryKeyFromPurchase,
  labelForCountryKey,
} from "@/lib/seller-analytics-geo";

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
    const productPageRaw = searchParams.get("productPage");
    const productPageParsed = productPageRaw
      ? Number.parseInt(productPageRaw, 10)
      : 1;
    const requestedProductPage =
      Number.isFinite(productPageParsed) && productPageParsed > 0
        ? productPageParsed
        : 1;
    const productTablePageSize = 10;

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
          buyerLocation: true,
          taxJurisdiction: true,
        },
      }),
      ProductInteractionService.getSellerProductViewCounts(userId),
    ]);

    const totalOrders = orderAggregate._count._all;
    const totalRevenueCents = Math.round(orderAggregate._sum.totalAmount ?? 0);
    const averageOrderValueCents =
      totalOrders > 0 ? Math.round(totalRevenueCents / totalOrders) : 0;
    // Approximate: paid order line items ÷ recorded product page views (not unique visitors).
    const conversionRatePercent =
      totalProductViews > 0
        ? Math.round((totalOrders / totalProductViews) * 10000) / 100
        : null;

    // Revenue per product for "top by sales" (paid orders only)
    const revenueByProduct = new Map<
      string,
      { productName: string; revenueCents: number }
    >();
    const purchasesByCountry = new Map<string, number>();
    for (const o of ordersForTopSales) {
      const c = countryKeyFromPurchase(o.buyerLocation, o.taxJurisdiction);
      purchasesByCountry.set(c, (purchasesByCountry.get(c) ?? 0) + 1);

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

    const topProductsBySales = Array.from(revenueByProduct.entries())
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

    const productIds = viewRows.map((r) => r.productId);

    const viewsByCountry =
      productIds.length > 0
        ? await aggregateProductViewsByCountry(productIds)
        : new Map<string, number>();

    const countryKeys = new Set([
      ...Array.from(viewsByCountry.keys()),
      ...Array.from(purchasesByCountry.keys()),
    ]);
    const countryBreakdown = Array.from(countryKeys)
      .map((countryKey) => ({
        countryKey,
        countryLabel: labelForCountryKey(countryKey),
        views: viewsByCountry.get(countryKey) ?? 0,
        purchases: purchasesByCountry.get(countryKey) ?? 0,
      }))
      .sort((a, b) => {
        const score = b.views + b.purchases - (a.views + a.purchases);
        if (score !== 0) return score;
        return a.countryLabel.localeCompare(b.countryLabel);
      });

    let productAnalyticsPage: {
      items: Array<{
        productId: string;
        productName: string;
        views: number;
        sales: number;
        wishlists: number;
        conversionRatePercent: number | null;
      }>;
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };

    if (productIds.length === 0) {
      productAnalyticsPage = {
        items: [],
        total: 0,
        page: 1,
        pageSize: productTablePageSize,
        totalPages: 1,
      };
    } else {
      const [salesGrouped, wishlistGrouped] = await Promise.all([
        db.order.groupBy({
          by: ["productId"],
          where: {
            ...orderWhere,
            productId: { in: productIds },
          },
          _count: { id: true },
        }),
        db.wishlistItem.groupBy({
          by: ["productId"],
          where: { productId: { in: productIds } },
          _count: { id: true },
        }),
      ]);

      const salesMap = new Map(
        salesGrouped.map((s) => [s.productId, s._count.id])
      );
      const wishMap = new Map(
        wishlistGrouped.map((w) => [w.productId, w._count.id])
      );

      const fullRows = viewRows.map((r) => {
        const sales = salesMap.get(r.productId) ?? 0;
        const wishlists = wishMap.get(r.productId) ?? 0;
        const conversionRatePercent =
          r.views > 0 ? Math.round((sales / r.views) * 10000) / 100 : null;
        return {
          productId: r.productId,
          productName: r.productName,
          views: r.views,
          sales,
          wishlists,
          conversionRatePercent,
        };
      });

      fullRows.sort((a, b) => {
        if (b.views !== a.views) return b.views - a.views;
        if (b.sales !== a.sales) return b.sales - a.sales;
        return a.productName.localeCompare(b.productName);
      });

      const total = fullRows.length;
      const totalPages = Math.max(1, Math.ceil(total / productTablePageSize));
      const page = Math.min(requestedProductPage, totalPages);
      const items = fullRows.slice(
        (page - 1) * productTablePageSize,
        page * productTablePageSize
      );

      productAnalyticsPage = {
        items,
        total,
        page,
        pageSize: productTablePageSize,
        totalPages,
      };
    }

    return NextResponse.json({
      preferredCurrency: seller.preferredCurrency,
      totalProductViews,
      totalShopViews,
      totalOrders,
      totalRevenueCents,
      averageOrderValueCents,
      conversionRatePercent,
      topProductsByViews,
      topProductsBySales,
      productAnalyticsPage,
      countryBreakdown,
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

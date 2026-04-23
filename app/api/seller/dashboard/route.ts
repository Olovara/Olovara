import { NextRequest, NextResponse } from "next/server";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getSellerOnboardingSteps } from "@/lib/onboarding";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = "force-dynamic";

/** UTC calendar day key YYYY-MM-DD — matches bucketing for the revenue chart. */
function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function utcStartOfDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

/**
 * Paid order amounts (cents) grouped by day or month for the selected range.
 * Daily buckets when span ≤ 90 days; otherwise monthly (UTC) to keep point counts reasonable.
 */
function buildSellerRevenueSeries(
  orders: { createdAt: Date; totalAmount: number }[],
  rangeStart: Date,
  rangeEnd: Date
): { label: string; revenueCents: number }[] {
  const start = utcStartOfDay(rangeStart);
  const end = utcStartOfDay(rangeEnd);
  if (start.getTime() > end.getTime()) {
    return [];
  }

  const spanDays =
    Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;

  if (spanDays > 90) {
    const byMonth = new Map<string, number>();
    for (const o of orders) {
      const d = o.createdAt;
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      byMonth.set(key, (byMonth.get(key) ?? 0) + Math.round(o.totalAmount));
    }

    const out: { label: string; revenueCents: number }[] = [];
    let y = start.getUTCFullYear();
    let m = start.getUTCMonth();
    const endY = end.getUTCFullYear();
    const endM = end.getUTCMonth();

    while (y < endY || (y === endY && m <= endM)) {
      const key = `${y}-${String(m + 1).padStart(2, "0")}`;
      const monthDate = new Date(Date.UTC(y, m, 1));
      out.push({
        label: monthDate.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }),
        revenueCents: byMonth.get(key) ?? 0,
      });
      m += 1;
      if (m > 11) {
        m = 0;
        y += 1;
      }
    }
    return out;
  }

  const byDay = new Map<string, number>();
  for (const o of orders) {
    const k = utcDayKey(o.createdAt);
    byDay.set(k, (byDay.get(k) ?? 0) + Math.round(o.totalAmount));
  }

  const out: { label: string; revenueCents: number }[] = [];
  for (let t = start.getTime(); t <= end.getTime(); t += 86_400_000) {
    const day = new Date(t);
    const key = utcDayKey(day);
    out.push({
      label: day.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
      revenueCents: byDay.get(key) ?? 0,
    });
  }
  return out;
}

// GET - Fetch seller dashboard data
export async function GET(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId");

    if (!sellerId) {
      return NextResponse.json(
        { error: "Seller ID is required" },
        { status: 400 }
      );
    }

    // Verify the user is the seller or an admin
    const seller = await db.seller.findUnique({
      where: { userId: sellerId },
      select: {
        id: true,
        userId: true,
        shopName: true,
        shopDescription: true,
        preferredCurrency: true,
        preferredWeightUnit: true,
        preferredDimensionUnit: true,
        preferredDistanceUnit: true,
        applicationAccepted: true,
        isFullyActivated: true,
        stripeConnected: true,
        totalSales: true,
        totalProducts: true,
        acceptsCustom: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Get onboarding steps
    const onboardingSteps = await getSellerOnboardingSteps(seller.id);

    // Check if user is the seller or has admin permissions
    if (session.user.id !== sellerId) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { admin: true },
      });

      if (!user?.admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const createdAtFilter: { gte?: Date; lte?: Date } = {};
    if (startDateParam) {
      createdAtFilter.gte = new Date(startDateParam);
    }
    if (endDateParam) {
      createdAtFilter.lte = new Date(endDateParam);
    }

    const orderWhere = {
      sellerId: seller.userId,
      paymentStatus: PaymentStatus.PAID,
      status: {
        notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED],
      },
      ...(Object.keys(createdAtFilter).length > 0
        ? { createdAt: createdAtFilter }
        : {}),
    };

    const userId = seller.userId;
    const hasDateRange = Boolean(startDateParam && endDateParam);

    const [
      orderAggregate,
      ordersForPopular,
      ordersForChart,
      totalProducts,
      activeProducts,
      hiddenProducts,
      disabledProducts,
      soldOutProducts,
      draftProducts,
    ] = await Promise.all([
      db.order.aggregate({
        where: orderWhere,
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      db.order.findMany({
        where: orderWhere,
        select: { id: true, productId: true, productName: true, quantity: true },
      }),
      hasDateRange
        ? db.order.findMany({
            where: orderWhere,
            select: { createdAt: true, totalAmount: true },
          })
        : Promise.resolve(
            [] as { createdAt: Date; totalAmount: number }[]
          ),
      db.product.count({ where: { userId } }),
      db.product.count({ where: { userId, status: "ACTIVE" } }),
      db.product.count({ where: { userId, status: "HIDDEN" } }),
      db.product.count({ where: { userId, status: "DISABLED" } }),
      db.product.count({
        where: { userId, status: "ACTIVE", stock: { lte: 0 } },
      }),
      db.product.count({ where: { userId, status: "DRAFT" } }),
    ]);

    const totalOrders = orderAggregate._count._all;
    const totalSales = Math.round(orderAggregate._sum.totalAmount ?? 0);
    const averageOrderValue =
      totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    const qtyByProduct = new Map<string, { name: string; qty: number }>();
    for (const o of ordersForPopular) {
      const key = o.productId ?? `custom:${o.id}`;
      const cur = qtyByProduct.get(key) ?? {
        name: o.productName,
        qty: 0,
      };
      cur.qty += o.quantity;
      qtyByProduct.set(key, cur);
    }
    let mostPopularProduct = "—";
    let maxQty = 0;
    qtyByProduct.forEach((v) => {
      if (v.qty > maxQty) {
        maxQty = v.qty;
        mostPopularProduct = v.name;
      }
    });

    const revenueSeries =
      hasDateRange && startDateParam && endDateParam
        ? buildSellerRevenueSeries(
            ordersForChart,
            new Date(startDateParam),
            new Date(endDateParam)
          )
        : [];

    return NextResponse.json({
      ...seller,
      onboardingSteps,
      totalOrders,
      totalSales,
      averageOrderValue,
      totalProducts,
      activeProducts,
      hiddenProducts,
      disabledProducts,
      soldOutProducts,
      draftProducts,
      mostPopularProduct,
      revenueSeries,
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching seller dashboard data:", error);

    // Log to database - user could email about "can't see dashboard"
    const userMessage = logError({
      code: "SELLER_DASHBOARD_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/dashboard",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch seller dashboard data",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

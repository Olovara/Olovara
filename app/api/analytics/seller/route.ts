import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  PlatformAnalyticsService,
  ProductInteractionService,
} from "@/lib/analytics";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();

    // Only users with VIEW_ANALYTICS permission can access seller analytics
    if (
      !session?.user?.id ||
      !(await hasPermission(session.user.id, "VIEW_ANALYTICS"))
    ) {
      return NextResponse.json(
        { error: "Unauthorized - Analytics access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type") || "DAILY";

    // Parse dates - limit to max 90 days to prevent slow queries
    const maxDays = 90;
    const defaultDays = 30;
    const requestedDays =
      startDate && endDate
        ? Math.ceil(
            (new Date(endDate).getTime() - new Date(startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : defaultDays;

    const days = Math.min(requestedDays, maxDays);
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const sellerId = session.user.id;

    // Check if request was aborted before starting heavy operations
    if (req.signal?.aborted) {
      return NextResponse.json({ error: "Request cancelled" }, { status: 499 });
    }

    // Get seller's preferred currency
    const sellerStartTime = Date.now();
    const seller = await db.seller.findUnique({
      where: { userId: sellerId },
      select: { preferredCurrency: true },
    });
    const preferredCurrency = seller?.preferredCurrency || "USD";
    console.log(`[PERF] Seller query took ${Date.now() - sellerStartTime}ms`);

    // Check again after first query
    if (req.signal?.aborted) {
      return NextResponse.json({ error: "Request cancelled" }, { status: 499 });
    }

    // Get seller metrics using the unified service with timeout protection
    const metricsStartTime = Date.now();
    let metrics;
    try {
      metrics = (await Promise.race([
        PlatformAnalyticsService.getSellerAnalytics(sellerId, start, end),
        new Promise(
          (_, reject) =>
            setTimeout(
              () => reject(new Error("Analytics query timeout")),
              30000
            ) // 30 second timeout
        ),
      ])) as any[];
    } catch (error: any) {
      if (error.message === "Analytics query timeout") {
        console.error(
          `[PERF] Analytics query timed out after ${Date.now() - metricsStartTime}ms`
        );
        return NextResponse.json(
          {
            error:
              "Analytics query took too long. Please try a shorter date range.",
          },
          { status: 504 }
        );
      }
      throw error;
    }
    console.log(
      `[PERF] Analytics query took ${Date.now() - metricsStartTime}ms`
    );

    // Check if request was aborted during analytics fetch
    if (req.signal?.aborted) {
      return NextResponse.json({ error: "Request cancelled" }, { status: 499 });
    }

    // Get total product view count for this seller with timeout
    const viewsStartTime = Date.now();
    let totalViews;
    try {
      totalViews = (await Promise.race([
        ProductInteractionService.getSellerTotalViewCount(sellerId),
        new Promise(
          (_, reject) =>
            setTimeout(
              () => reject(new Error("View count query timeout")),
              10000
            ) // 10 second timeout
        ),
      ])) as number;
    } catch (error: any) {
      if (error.message === "View count query timeout") {
        console.error(
          `[PERF] View count query timed out after ${Date.now() - viewsStartTime}ms`
        );
        totalViews = 0; // Fallback to 0 if query times out
      } else {
        throw error;
      }
    }
    console.log(
      `[PERF] View count query took ${Date.now() - viewsStartTime}ms`
    );

    // Check again before final query
    if (req.signal?.aborted) {
      return NextResponse.json({ error: "Request cancelled" }, { status: 499 });
    }

    // Get view counts per product with timeout
    const productViewsStartTime = Date.now();
    let productViewCounts;
    try {
      productViewCounts = (await Promise.race([
        ProductInteractionService.getSellerProductViewCounts(sellerId),
        new Promise(
          (_, reject) =>
            setTimeout(
              () => reject(new Error("Product views query timeout")),
              10000
            ) // 10 second timeout
        ),
      ])) as any[];
    } catch (error: any) {
      if (error.message === "Product views query timeout") {
        console.error(
          `[PERF] Product views query timed out after ${Date.now() - productViewsStartTime}ms`
        );
        productViewCounts = []; // Fallback to empty array if query times out
      } else {
        throw error;
      }
    }
    console.log(
      `[PERF] Product views query took ${Date.now() - productViewsStartTime}ms`
    );

    // Calculate summary metrics
    const summary = {
      totalOrders: metrics.reduce(
        (sum: number, m: any) => sum + m.totalOrders,
        0
      ),
      totalRevenue: metrics.reduce(
        (sum: number, m: any) => sum + m.totalRevenue,
        0
      ),
      totalViews: totalViews, // Add total product views
      averageOrderValue: 0,
      conversionRate: 0,
      customerRetentionRate: 0,
      averageRating: 0,
      chargebacks: metrics.reduce(
        (sum: number, m: any) => sum + m.chargebacks,
        0
      ),
      disputes: metrics.reduce((sum: number, m: any) => sum + m.disputes, 0),
      period: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
      dataPoints: metrics.length,
    };

    // Calculate averages
    if (summary.totalOrders > 0) {
      summary.averageOrderValue = Math.round(
        summary.totalRevenue / summary.totalOrders
      );
    }

    if (metrics.length > 0) {
      const avgConversion =
        metrics.reduce((sum: number, m: any) => sum + m.conversionRate, 0) /
        metrics.length;
      const avgRetention =
        metrics.reduce(
          (sum: number, m: any) => sum + m.customerRetentionRate,
          0
        ) / metrics.length;
      const avgRating =
        metrics.reduce((sum: number, m: any) => sum + m.averageRating, 0) /
        metrics.length;

      summary.conversionRate = Math.round(avgConversion * 100) / 100;
      summary.customerRetentionRate = Math.round(avgRetention * 100) / 100;
      summary.averageRating = Math.round(avgRating * 100) / 100;
    }

    const totalTime = Date.now() - startTime;
    console.log(`[PERF] Total analytics request took ${totalTime}ms`);

    // Warn if request took too long
    if (totalTime > 20000) {
      console.warn(
        `[PERF] WARNING: Analytics request took ${totalTime}ms - consider optimizing queries`
      );
    }

    return NextResponse.json({
      success: true,
      summary,
      preferredCurrency, // Include seller's preferred currency
      metrics: metrics.map((m: any) => ({
        date: m.date,
        totalOrders: m.totalOrders,
        totalRevenue: m.totalRevenue,
        averageOrderValue: m.averageOrderValue,
        conversionRate: m.conversionRate,
        uniqueCustomers: m.uniqueCustomers,
        customerRetentionRate: m.customerRetentionRate,
        averageRating: m.averageRating,
        totalReviews: m.totalReviews,
        chargebacks: m.chargebacks,
        disputes: m.disputes,
      })),
      productViewCounts, // Include per-product view counts
    });
  } catch (error: any) {
    // Handle connection reset errors gracefully - these are common when clients timeout
    if (error?.code === "ECONNRESET" || error?.message?.includes("aborted")) {
      // Don't log these as errors - they're expected when clients close connections
      return NextResponse.json(
        { error: "Request cancelled by client" },
        { status: 499 }
      );
    }

    // Log to console (always happens)
    console.error("Error fetching seller analytics:", error);

    // Log to database - seller could email about "can't load my analytics"
    const userMessage = logError({
      code: "SELLER_ANALYTICS_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/analytics/seller",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch seller analytics",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();

    // Only users with VIEW_ANALYTICS permission can generate analytics
    if (
      !session?.user?.id ||
      !(await hasPermission(session.user.id, "VIEW_ANALYTICS"))
    ) {
      return NextResponse.json(
        { error: "Unauthorized - Analytics access required" },
        { status: 401 }
      );
    }

    body = await req.json();
    const { date } = body;

    const sellerId = session.user.id;

    // Generate daily metrics for specified date or today
    const targetDate = date ? new Date(date) : new Date();
    const metrics = await PlatformAnalyticsService.generateAnalytics(
      { sellerId },
      targetDate,
      "DAILY"
    );

    return NextResponse.json({
      success: true,
      message: "Analytics generated successfully",
      metrics,
    });
  } catch (error: any) {
    // Handle connection reset errors gracefully
    if (error?.code === "ECONNRESET" || error?.message?.includes("aborted")) {
      return NextResponse.json(
        { error: "Request cancelled by client" },
        { status: 499 }
      );
    }

    // Log to console (always happens)
    console.error("Error generating seller analytics:", error);

    // Log to database - seller could email about "couldn't generate analytics"
    const userMessage = logError({
      code: "SELLER_ANALYTICS_GENERATE_FAILED",
      userId: session?.user?.id,
      route: "/api/analytics/seller",
      method: "POST",
      error,
      metadata: {
        date: body?.date,
        note: "Failed to generate seller analytics",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

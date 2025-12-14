import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PlatformAnalyticsService } from "@/lib/analytics";
import { hasPermission } from "@/lib/permissions";
import { logError } from "@/lib/error-logger";

export async function GET(req: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();

    // Only users with VIEW_ANALYTICS permission can access marketplace analytics
    if (
      !session?.user?.id ||
      !(await hasPermission(session.user.id, "VIEW_ANALYTICS"))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type") || "DAILY";

    // Parse dates
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate ? new Date(endDate) : new Date();

    // Get marketplace metrics using the unified service
    const metrics = await PlatformAnalyticsService.getPlatformAnalytics(
      start,
      end
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
      averageOrderValue: 0,
      conversionRate: 0,
      cartAbandonmentRate: 0,
      fraudAttempts: metrics.reduce(
        (sum: number, m: any) =>
          sum + (m.metrics?.platformMetrics?.fraudAttempts || 0),
        0
      ),
      chargebacks: metrics.reduce(
        (sum: number, m: any) =>
          sum + (m.metrics?.platformMetrics?.chargebacks || 0),
        0
      ),
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
        metrics.reduce(
          (sum: number, m: any) => sum + (m.conversionRate || 0),
          0
        ) / metrics.length;
      const avgAbandonment =
        metrics.reduce(
          (sum: number, m: any) =>
            sum + (m.metrics?.platformMetrics?.cartAbandonmentRate || 0),
          0
        ) / metrics.length;
      summary.conversionRate = Math.round(avgConversion * 100) / 100;
      summary.cartAbandonmentRate = Math.round(avgAbandonment * 100) / 100;
    }

    return NextResponse.json({
      success: true,
      summary,
      metrics: metrics.map((m: any) => ({
        date: m.date,
        totalOrders: m.totalOrders,
        totalRevenue: m.totalRevenue,
        averageOrderValue: m.averageOrderValue,
        conversionRate: m.conversionRate,
        cartAbandonmentRate:
          m.metrics?.platformMetrics?.cartAbandonmentRate || 0,
        fraudAttempts: m.metrics?.platformMetrics?.fraudAttempts || 0,
        chargebacks: m.metrics?.platformMetrics?.chargebacks || 0,
        topCountries: m.metrics?.platformMetrics?.topCountries || [],
      })),
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching marketplace analytics:", error);

    // Log to database - admin could email about "can't load marketplace analytics"
    const userMessage = logError({
      code: "MARKETPLACE_ANALYTICS_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/analytics/marketplace",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch marketplace analytics",
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    body = await req.json();
    const { date } = body;

    // Generate daily metrics for specified date or today
    const targetDate = date ? new Date(date) : new Date();
    const metrics = await PlatformAnalyticsService.generateAnalytics(
      {},
      targetDate,
      "DAILY"
    );

    return NextResponse.json({
      success: true,
      message: "Analytics generated successfully",
      metrics,
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error generating marketplace analytics:", error);

    // Log to database - admin could email about "couldn't generate marketplace analytics"
    const userMessage = logError({
      code: "MARKETPLACE_ANALYTICS_GENERATE_FAILED",
      userId: session?.user?.id,
      route: "/api/analytics/marketplace",
      method: "POST",
      error,
      metadata: {
        date: body?.date,
        note: "Failed to generate marketplace analytics",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

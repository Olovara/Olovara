import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PlatformAnalyticsService } from "@/lib/analytics";
import { hasPermission } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    // Only users with VIEW_ANALYTICS permission can access marketplace analytics
    if (!session?.user?.id || !(await hasPermission(session.user.id, 'VIEW_ANALYTICS'))) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type') || 'DAILY';

    // Parse dates
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate ? new Date(endDate) : new Date();

    // Get marketplace metrics using the unified service
    const metrics = await PlatformAnalyticsService.getPlatformAnalytics(start, end);

    // Calculate summary metrics
    const summary = {
      totalOrders: metrics.reduce((sum: number, m: any) => sum + m.totalOrders, 0),
      totalRevenue: metrics.reduce((sum: number, m: any) => sum + m.totalRevenue, 0),
      averageOrderValue: 0,
      conversionRate: 0,
      cartAbandonmentRate: 0,
      fraudAttempts: metrics.reduce((sum: number, m: any) => sum + (m.metrics?.platformMetrics?.fraudAttempts || 0), 0),
      chargebacks: metrics.reduce((sum: number, m: any) => sum + (m.metrics?.platformMetrics?.chargebacks || 0), 0),
      period: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
      dataPoints: metrics.length
    };

    // Calculate averages
    if (summary.totalOrders > 0) {
      summary.averageOrderValue = Math.round(summary.totalRevenue / summary.totalOrders);
    }

    if (metrics.length > 0) {
      const avgConversion = metrics.reduce((sum: number, m: any) => sum + (m.conversionRate || 0), 0) / metrics.length;
      const avgAbandonment = metrics.reduce((sum: number, m: any) => sum + (m.metrics?.platformMetrics?.cartAbandonmentRate || 0), 0) / metrics.length;
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
        cartAbandonmentRate: m.metrics?.platformMetrics?.cartAbandonmentRate || 0,
        fraudAttempts: m.metrics?.platformMetrics?.fraudAttempts || 0,
        chargebacks: m.metrics?.platformMetrics?.chargebacks || 0,
        topCountries: m.metrics?.platformMetrics?.topCountries || []
      }))
    });

  } catch (error) {
    console.error('Error fetching marketplace analytics:', error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    // Only users with VIEW_ANALYTICS permission can generate analytics
    if (!session?.user?.id || !(await hasPermission(session.user.id, 'VIEW_ANALYTICS'))) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { date } = body;

    // Generate daily metrics for specified date or today
    const targetDate = date ? new Date(date) : new Date();
    const metrics = await PlatformAnalyticsService.generateAnalytics({}, targetDate, 'DAILY');

    return NextResponse.json({
      success: true,
      message: "Analytics generated successfully",
      metrics
    });

  } catch (error) {
    console.error('Error generating marketplace analytics:', error);
    return NextResponse.json(
      { error: "Failed to generate analytics" },
      { status: 500 }
    );
  }
} 
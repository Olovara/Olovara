import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PlatformAnalyticsService, ProductInteractionService } from "@/lib/analytics";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    // Only users with VIEW_ANALYTICS permission can access seller analytics
    if (!session?.user?.id || !(await hasPermission(session.user.id, 'VIEW_ANALYTICS'))) {
      return NextResponse.json(
        { error: "Unauthorized - Analytics access required" },
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

    const sellerId = session.user.id;

    // Check if request was aborted before starting heavy operations
    if (req.signal?.aborted) {
      return NextResponse.json(
        { error: "Request cancelled" },
        { status: 499 }
      );
    }

    // Get seller's preferred currency
    const seller = await db.seller.findUnique({
      where: { userId: sellerId },
      select: { preferredCurrency: true }
    });
    const preferredCurrency = seller?.preferredCurrency || "USD";

    // Check again after first query
    if (req.signal?.aborted) {
      return NextResponse.json(
        { error: "Request cancelled" },
        { status: 499 }
      );
    }

    // Get seller metrics using the unified service
    const metrics = await PlatformAnalyticsService.getSellerAnalytics(sellerId, start, end);

    // Check if request was aborted during analytics fetch
    if (req.signal?.aborted) {
      return NextResponse.json(
        { error: "Request cancelled" },
        { status: 499 }
      );
    }

    // Get total product view count for this seller
    const totalViews = await ProductInteractionService.getSellerTotalViewCount(sellerId);
    
    // Check again before final query
    if (req.signal?.aborted) {
      return NextResponse.json(
        { error: "Request cancelled" },
        { status: 499 }
      );
    }
    
    // Get view counts per product
    const productViewCounts = await ProductInteractionService.getSellerProductViewCounts(sellerId);

    // Calculate summary metrics
    const summary = {
      totalOrders: metrics.reduce((sum: number, m: any) => sum + m.totalOrders, 0),
      totalRevenue: metrics.reduce((sum: number, m: any) => sum + m.totalRevenue, 0),
      totalViews: totalViews, // Add total product views
      averageOrderValue: 0,
      conversionRate: 0,
      customerRetentionRate: 0,
      averageRating: 0,
      chargebacks: metrics.reduce((sum: number, m: any) => sum + m.chargebacks, 0),
      disputes: metrics.reduce((sum: number, m: any) => sum + m.disputes, 0),
      period: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
      dataPoints: metrics.length
    };

    // Calculate averages
    if (summary.totalOrders > 0) {
      summary.averageOrderValue = Math.round(summary.totalRevenue / summary.totalOrders);
    }

    if (metrics.length > 0) {
      const avgConversion = metrics.reduce((sum: number, m: any) => sum + m.conversionRate, 0) / metrics.length;
      const avgRetention = metrics.reduce((sum: number, m: any) => sum + m.customerRetentionRate, 0) / metrics.length;
      const avgRating = metrics.reduce((sum: number, m: any) => sum + m.averageRating, 0) / metrics.length;
      
      summary.conversionRate = Math.round(avgConversion * 100) / 100;
      summary.customerRetentionRate = Math.round(avgRetention * 100) / 100;
      summary.averageRating = Math.round(avgRating * 100) / 100;
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
        disputes: m.disputes
      })),
      productViewCounts // Include per-product view counts
    });

  } catch (error: any) {
    // Handle connection reset errors gracefully - these are common when clients timeout
    if (error?.code === 'ECONNRESET' || error?.message?.includes('aborted')) {
      // Don't log these as errors - they're expected when clients close connections
      return NextResponse.json(
        { error: "Request cancelled by client" },
        { status: 499 }
      );
    }
    
    console.error('Error fetching seller analytics:', error);
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
        { error: "Unauthorized - Analytics access required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { date } = body;

    const sellerId = session.user.id;

    // Generate daily metrics for specified date or today
    const targetDate = date ? new Date(date) : new Date();
    const metrics = await PlatformAnalyticsService.generateAnalytics({ sellerId }, targetDate, 'DAILY');

    return NextResponse.json({
      success: true,
      message: "Analytics generated successfully",
      metrics
    });

  } catch (error: any) {
    // Handle connection reset errors gracefully
    if (error?.code === 'ECONNRESET' || error?.message?.includes('aborted')) {
      return NextResponse.json(
        { error: "Request cancelled by client" },
        { status: 499 }
      );
    }
    
    console.error('Error generating seller analytics:', error);
    return NextResponse.json(
      { error: "Failed to generate analytics" },
      { status: 500 }
    );
  }
} 
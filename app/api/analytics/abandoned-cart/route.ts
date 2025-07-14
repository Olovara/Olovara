import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getUserAnalytics } from "@/lib/ipinfo";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    
    const {
      sessionId,
      productId,
      productName,
      price,
      quantity,
      total,
      isDigital,
      sellerId,
      stepsCompleted,
      lastStep,
      timeSpent,
      abandonmentReason,
      fieldInteractions,
      pageViews,
      scrollDepth,
      metadata
    } = body;

    // Validate required fields
    if (!sessionId || !productId || !productName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user analytics data
    const forwarded = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    const clientIP = forwarded?.split(',')[0] || realIP || req.ip || '';
    
    let locationData = null;
    try {
      locationData = await getUserAnalytics(clientIP);
    } catch (error) {
      console.warn('Failed to get location data for abandoned cart:', error);
    }

    // Determine device type from user agent
    const userAgent = req.headers.get('user-agent') || '';
    let deviceType = 'desktop';
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      deviceType = 'mobile';
    } else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
      deviceType = 'tablet';
    }

    // Create abandoned cart record
    const abandonedCart = await db.abandonedCart.create({
      data: {
        sessionId,
        userId: session?.user?.id || null,
        productId,
        productName,
        price: Math.round(price * 100), // Convert to cents
        quantity,
        total: Math.round(total * 100), // Convert to cents
        isDigital,
        sellerId,
        stepsCompleted: stepsCompleted || [],
        lastStep,
        timeSpent,
        abandonmentReason,
        fieldInteractions: fieldInteractions || [],
        pageViews: pageViews || 1,
        scrollDepth,
        userAgent,
        ipAddress: clientIP,
        location: locationData,
        deviceType,
        metadata: metadata || {},
      },
    });

    console.log(`✅ Abandoned cart saved: ${abandonedCart.id} for product ${productName}`);

    return NextResponse.json({
      success: true,
      abandonedCartId: abandonedCart.id,
    });

  } catch (error) {
    console.error("❌ Error saving abandoned cart:", error);
    return NextResponse.json(
      { error: "Failed to save abandoned cart data" },
      { status: 500 }
    );
  }
}

// Get abandoned cart analytics (for admin dashboard)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    // Only allow admins to view analytics
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await db.admin.findUnique({
      where: { userId: session.user.id },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');
    const limit = parseInt(searchParams.get('limit') || '100');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get abandoned cart statistics
    const abandonedCarts = await db.abandonedCart.findMany({
      where: {
        createdAt: {
          gte: cutoffDate,
        },
        recovered: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    // Get summary statistics
    const totalAbandoned = await db.abandonedCart.count({
      where: {
        createdAt: {
          gte: cutoffDate,
        },
        recovered: false,
      },
    });

    const totalRecovered = await db.abandonedCart.count({
      where: {
        createdAt: {
          gte: cutoffDate,
        },
        recovered: true,
      },
    });

    const recoveryRate = totalAbandoned > 0 ? (totalRecovered / (totalAbandoned + totalRecovered)) * 100 : 0;

    // Get abandonment reasons breakdown
    const abandonmentReasons = await db.abandonedCart.groupBy({
      by: ['abandonmentReason'],
      where: {
        createdAt: {
          gte: cutoffDate,
        },
        recovered: false,
      },
      _count: {
        abandonmentReason: true,
      },
    });

    // Get top abandoned products
    const topAbandonedProducts = await db.abandonedCart.groupBy({
      by: ['productId', 'productName'],
      where: {
        createdAt: {
          gte: cutoffDate,
        },
        recovered: false,
      },
      _count: {
        productId: true,
      },
      _sum: {
        total: true,
      },
      orderBy: {
        _count: {
          productId: 'desc',
        },
      },
      take: 10,
    });

    return NextResponse.json({
      abandonedCarts,
      summary: {
        totalAbandoned,
        totalRecovered,
        recoveryRate: Math.round(recoveryRate * 100) / 100,
        periodDays: days,
      },
      abandonmentReasons,
      topAbandonedProducts,
    });

  } catch (error) {
    console.error("❌ Error fetching abandoned cart analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
} 
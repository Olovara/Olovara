import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getUserAnalytics } from "@/lib/ipinfo";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();
    body = await req.json();

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
      metadata,
    } = body;

    // Validate required fields
    if (!sessionId || !productId || !productName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user analytics data
    const forwarded = req.headers.get("x-forwarded-for");
    const realIP = req.headers.get("x-real-ip");
    const clientIP = forwarded?.split(",")[0] || realIP || req.ip || "";

    let locationData = null;
    try {
      locationData = await getUserAnalytics(clientIP);
    } catch (error) {
      console.warn("Failed to get location data for abandoned cart:", error);
    }

    // Determine device type from user agent
    const userAgent = req.headers.get("user-agent") || "";
    let deviceType = "desktop";
    if (
      userAgent.includes("Mobile") ||
      userAgent.includes("Android") ||
      userAgent.includes("iPhone")
    ) {
      deviceType = "mobile";
    } else if (userAgent.includes("iPad") || userAgent.includes("Tablet")) {
      deviceType = "tablet";
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

    console.log(
      `✅ Abandoned cart saved: ${abandonedCart.id} for product ${productName}`
    );

    return NextResponse.json({
      success: true,
      abandonedCartId: abandonedCart.id,
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("❌ Error saving abandoned cart:", error);

    // Don't log validation errors - they're expected client-side issues

    // Log to database - user could email about "abandoned cart not saving"
    const userMessage = logError({
      code: "ABANDONED_CART_SAVE_FAILED",
      userId: session?.user?.id,
      route: "/api/analytics/abandoned-cart",
      method: "POST",
      error,
      metadata: {
        productId: body?.productId,
        sessionId: body?.sessionId,
        note: "Failed to save abandoned cart",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

// Get abandoned cart analytics (for admin dashboard)
export async function GET(req: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();

    // Only allow admins to view analytics
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await db.admin.findUnique({
      where: { userId: session.user.id },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30");
    const limit = parseInt(searchParams.get("limit") || "100");

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
        createdAt: "desc",
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

    const recoveryRate =
      totalAbandoned > 0
        ? (totalRecovered / (totalAbandoned + totalRecovered)) * 100
        : 0;

    // Get abandonment reasons breakdown
    const abandonmentReasons = await db.abandonedCart.groupBy({
      by: ["abandonmentReason"],
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
      by: ["productId", "productName"],
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
          productId: "desc",
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
    // Log to console (always happens)
    console.error("❌ Error fetching abandoned cart analytics:", error);

    // Log to database - admin could email about "can't load abandoned cart analytics"
    const userMessage = logError({
      code: "ABANDONED_CART_ANALYTICS_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/analytics/abandoned-cart",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch abandoned cart analytics",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

// Delete abandoned cart record (when checkout is completed)
export async function DELETE(req: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();
    body = await req.json();

    const { sessionId, productId, userId } = body;

    // Validate required fields - either sessionId or productId+userId
    if (!productId || (!sessionId && !userId)) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: productId and either sessionId or userId",
        },
        { status: 400 }
      );
    }

    // Build where clause based on available data
    const whereClause: any = {
      productId: productId,
      recovered: false, // Only delete non-recovered carts
    };

    if (sessionId) {
      whereClause.sessionId = sessionId;
    }

    if (userId) {
      whereClause.userId = userId;
    } else {
      whereClause.userId = session?.user?.id || null; // Match user ID if logged in, null if guest
    }

    // Find and delete the abandoned cart record(s)
    const deletedCart = await db.abandonedCart.deleteMany({
      where: whereClause,
    });

    console.log(
      `✅ Deleted ${deletedCart.count} abandoned cart record(s) for product ${productId}`
    );

    return NextResponse.json({
      success: true,
      deletedCount: deletedCart.count,
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("❌ Error deleting abandoned cart:", error);

    // Don't log validation errors - they're expected client-side issues

    // Log to database - user could email about "couldn't delete abandoned cart"
    const userMessage = logError({
      code: "ABANDONED_CART_DELETE_FAILED",
      userId: session?.user?.id,
      route: "/api/analytics/abandoned-cart",
      method: "DELETE",
      error,
      metadata: {
        productId: body?.productId,
        sessionId: body?.sessionId,
        note: "Failed to delete abandoned cart",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

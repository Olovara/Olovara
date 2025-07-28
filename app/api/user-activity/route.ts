import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { FraudDetectionService } from "@/lib/analytics";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, deviceFingerprint, details } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    // Get client IP address
    const ipAddress =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Get user agent
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Track user activity with fraud detection
    await FraudDetectionService.trackUserActivity({
      userId: session.user.id,
      action,
      ipAddress,
      userAgent,
      deviceFingerprint,
      success: true,
      details,
    });

    return NextResponse.json({
      success: true,
      message: "Activity tracked successfully",
    });
  } catch (error) {
    console.error("Error tracking user activity:", error);
    return NextResponse.json(
      { error: "Failed to track activity" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const action = searchParams.get("action");

    // Get user activity logs
    const whereClause: any = { userId: session.user.id };
    if (action) {
      whereClause.action = action;
    }

    const activities = await db.userActivityLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await db.userActivityLog.count({
      where: whereClause,
    });

    return NextResponse.json({
      success: true,
      activities,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error getting user activity:", error);
    return NextResponse.json(
      { error: "Failed to get user activity" },
      { status: 500 }
    );
  }
}

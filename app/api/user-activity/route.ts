import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { FraudDetectionService } from "@/lib/analytics";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    body = await req.json();
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
    // Log to console (always happens)
    console.error("Error tracking user activity:", error);

    // Log to database - user could email about "activity not being tracked"
    const userMessage = logError({
      code: "USER_ACTIVITY_TRACK_FAILED",
      userId: session?.user?.id,
      route: "/api/user-activity",
      method: "POST",
      error,
      metadata: {
        action: body?.action,
        deviceFingerprint: body?.deviceFingerprint,
        note: "Failed to track user activity",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();

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
    // Log to console (always happens)
    console.error("Error getting user activity:", error);

    // Log to database - user could email about "can't see my activity"
    const userMessage = logError({
      code: "USER_ACTIVITY_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/user-activity",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch user activity",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

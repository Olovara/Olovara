import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserSessionService } from "@/lib/analytics";
import { logError } from "@/lib/error-logger";

export async function POST(req: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();

    // Handle empty or malformed request body
    try {
      const text = await req.text();
      if (!text || text.trim() === "") {
        return NextResponse.json(
          { error: "Request body is empty" },
          { status: 400 }
        );
      }
      body = JSON.parse(text);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const {
      sessionId,
      deviceId,
      ipAddress,
      userAgent,
      location,
      browser,
      os,
      deviceType,
      isFirstVisit,
      visitNumber,
      returningUser,
    } = body || {};

    // Validate required fields
    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get client IP if not provided
    const clientIP =
      ipAddress ||
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      req.ip ||
      "unknown";

    // Create the session
    const userSession = await UserSessionService.createSession({
      userId: session?.user?.id,
      sessionId,
      deviceId,
      ipAddress: clientIP,
      userAgent: userAgent || req.headers.get("user-agent"),
      location,
      browser,
      os,
      deviceType,
      isFirstVisit,
      visitNumber,
      returningUser,
    });

    return NextResponse.json({
      success: true,
      session: userSession,
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error creating session:", error);

    // Don't log JSON parse errors - they're expected client-side issues

    // Log to database - user could email about "session tracking not working"
    const userMessage = logError({
      code: "SESSION_ANALYTICS_CREATE_FAILED",
      userId: session?.user?.id,
      route: "/api/analytics/session",
      method: "POST",
      error,
      metadata: {
        sessionId: body?.sessionId,
        note: "Failed to create session",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();

    // Handle empty or malformed request body
    try {
      body = await req.json();
    } catch (jsonError) {
      console.error("Error parsing request body:", jsonError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { sessionId, conversionValue } = body || {};

    // Validate required fields
    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // End the session
    await UserSessionService.endSession(sessionId, conversionValue);

    return NextResponse.json({
      success: true,
      message: "Session ended successfully",
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error ending session:", error);

    // Don't log JSON parse errors - they're expected client-side issues

    // Log to database - user could email about "couldn't end session"
    const userMessage = logError({
      code: "SESSION_ANALYTICS_END_FAILED",
      userId: session?.user?.id,
      route: "/api/analytics/session",
      method: "PATCH",
      error,
      metadata: {
        sessionId: body?.sessionId,
        note: "Failed to end session",
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
    const userId = searchParams.get("userId");
    const deviceId = searchParams.get("deviceId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const isActive = searchParams.get("isActive");

    // Parse dates
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    // Get session analytics
    const sessions = await UserSessionService.getSessionAnalytics({
      userId: userId || session.user.id,
      deviceId: deviceId || undefined,
      startDate: start,
      endDate: end,
      isActive: isActive ? isActive === "true" : undefined,
    });

    return NextResponse.json({
      success: true,
      sessions,
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error getting session analytics:", error);

    // Log to database - user could email about "can't load session analytics"
    const userMessage = logError({
      code: "SESSION_ANALYTICS_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/analytics/session",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch session analytics",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

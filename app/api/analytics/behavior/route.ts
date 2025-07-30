import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserBehaviorService } from "@/lib/analytics";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    
    const {
      sessionId,
      eventType,
      pageUrl,
      referrerUrl,
      elementId,
      elementType,
      elementText,
      interactionData,
      timeOnPage,
      scrollDepth,
      mouseMovements,
      clicks,
      deviceId,
      ipAddress,
      userAgent,
      location,
      isFirstVisit,
      visitNumber,
      sessionDuration,
      timestamp
    } = body;

    // Validate required fields
    if (!sessionId || !eventType || !pageUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get client IP if not provided
    const clientIP = ipAddress || req.headers.get('x-forwarded-for')?.split(',')[0] || 
                    req.headers.get('x-real-ip') || 
                    req.ip || 'unknown';

    // Track the behavior event
    const event = await UserBehaviorService.trackBehaviorEvent({
      userId: session?.user?.id,
      sessionId,
      eventType,
      pageUrl,
      referrerUrl,
      elementId,
      elementType,
      elementText,
      interactionData,
      timeOnPage,
      scrollDepth,
      mouseMovements,
      clicks,
      deviceId,
      ipAddress: clientIP,
      userAgent: userAgent || req.headers.get('user-agent'),
      location,
      isFirstVisit,
      visitNumber,
      sessionDuration,
    });

    return NextResponse.json({
      success: true,
      event
    });

  } catch (error) {
    console.error('Error tracking behavior event:', error);
    return NextResponse.json(
      { error: "Failed to track behavior event" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    const eventType = searchParams.get('eventType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const deviceId = searchParams.get('deviceId');

    // Parse dates
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    // Get behavior analytics
    const events = await UserBehaviorService.getBehaviorAnalytics({
      userId: userId || session.user.id,
      sessionId: sessionId || undefined,
      eventType: eventType || undefined,
      startDate: start,
      endDate: end,
      deviceId: deviceId || undefined,
    });

    return NextResponse.json({
      success: true,
      events
    });

  } catch (error) {
    console.error('Error getting behavior analytics:', error);
    return NextResponse.json(
      { error: "Failed to get behavior analytics" },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserBehaviorService } from "@/lib/analytics";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    // Handle empty or malformed request body
    let body;
    try {
      body = await req.json();
    } catch (jsonError) {
      console.error('Error parsing request body:', jsonError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    const { events, ...singleEvent } = body || {}; // Destructure with default empty object
    
    // Handle batched events
    if (events && Array.isArray(events)) {
      const results = [];
      
      for (const event of events) {
        try {
          const result = await UserBehaviorService.trackBehaviorEvent({
            userId: session?.user?.id,
            sessionId: event.sessionId,
            eventType: event.eventType,
            pageUrl: event.pageUrl,
            referrerUrl: event.referrerUrl,
            elementId: event.elementId,
            elementType: event.elementType,
            elementText: event.elementText,
            interactionData: event.interactionData,
            timeOnPage: event.timeOnPage,
            scrollDepth: event.scrollDepth,
            mouseMovements: event.mouseMovements,
            clicks: event.clicks,
            deviceId: event.deviceId,
            ipAddress: event.ipAddress,
            userAgent: event.userAgent,
            location: event.location,
            isFirstVisit: event.isFirstVisit,
            visitNumber: event.visitNumber,
            sessionDuration: event.sessionDuration,
          });
          results.push({ success: true, eventId: result.id });
        } catch (error) {
          console.error('Error tracking batched event:', error);
          results.push({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
      
      return NextResponse.json({ 
        message: "Batched events processed", 
        results,
        successCount: results.filter(r => r.success).length,
        failureCount: results.filter(r => !r.success).length
      });
    }
    
    // Handle single event (backward compatibility)
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
      sessionDuration
    } = singleEvent; // Use singleEvent for backward compatibility

    // Validate required fields
    if (!sessionId || !eventType || !pageUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await UserBehaviorService.trackBehaviorEvent({
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
      ipAddress,
      userAgent,
      location,
      isFirstVisit,
      visitNumber,
      sessionDuration,
    });

    return NextResponse.json({ 
      message: "Event tracked successfully", 
      eventId: result.id 
    });
  } catch (error) {
    console.error('Error tracking behavior event:', error);
    return NextResponse.json(
      { error: "Internal server error" },
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
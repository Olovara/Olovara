import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  UserBehaviorService,
  ProductInteractionService,
  EnhancedAnalyticsService,
} from "@/lib/analytics";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

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

    const { events, sessionId, deviceId } = body || {};

    // Handle single event
    if (!Array.isArray(events)) {
      return NextResponse.json(
        { error: "Events must be an array" },
        { status: 400 }
      );
    }

    // Get client IP
    const clientIP =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      req.ip ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || undefined;

    // Process each event based on its type
    const processedEvents = [];

    for (const event of events) {
      const {
        eventType,
        pageUrl,
        referrerUrl,
        elementId,
        elementType,
        elementText,
        interactionData,
        timestamp,
        userId = session?.user?.id,
      } = event;

      // Route events to appropriate services
      switch (eventType) {
        case "PRODUCT_INTERACTION":
          if (interactionData?.productId) {
            await ProductInteractionService.trackProductInteraction({
              userId,
              productId: interactionData.productId,
              sessionId: sessionId || "unknown",
              interactionType: interactionData.interactionType,
              interactionData: interactionData.interactionData,
              timeOnProduct: interactionData.timeOnProduct,
              imagesViewed: interactionData.imagesViewed,
              descriptionRead: interactionData.descriptionRead,
              reviewsViewed: interactionData.reviewsViewed,
              sellerInfoViewed: interactionData.sellerInfoViewed,
              sourceType: interactionData.sourceType,
              sourceId: interactionData.sourceId,
              referrerUrl,
              deviceId,
              ipAddress: clientIP,
              userAgent,
            });
          }
          break;

        case "PURCHASE_INTENT":
          if (interactionData?.productId && interactionData?.sellerId) {
            await EnhancedAnalyticsService.trackPurchaseIntent({
              userId,
              sessionId: sessionId || "unknown",
              productId: interactionData.productId,
              sellerId: interactionData.sellerId,
              amount: interactionData.amount,
              currency: interactionData.currency,
              step: interactionData.step,
              failureReason: interactionData.failureReason,
              deviceId,
              ipAddress: clientIP,
              userAgent,
            });
          }
          break;

        case "CUSTOM_ORDER":
          if (interactionData?.sellerId) {
            await EnhancedAnalyticsService.trackCustomOrderEvent({
              userId: userId || "unknown",
              sessionId: sessionId || "unknown",
              sellerId: interactionData.sellerId,
              action: interactionData.action,
              formId: interactionData.formId,
              amount: interactionData.amount,
              failureReason: interactionData.failureReason,
              deviceId,
              ipAddress: clientIP,
              userAgent,
            });
          }
          break;

        case "BEHAVIOR_SUMMARY":
          // Store aggregated behavior data instead of individual events
          await UserBehaviorService.trackBehaviorEvent({
            userId,
            sessionId: sessionId || "unknown",
            eventType: "BEHAVIOR_SUMMARY",
            pageUrl,
            referrerUrl,
            interactionData: {
              mouseMovements: interactionData.mouseMovements,
              avgVelocity: interactionData.avgVelocity,
              movementPattern: interactionData.movementPattern,
              riskScore: interactionData.riskScore,
              scrollDepth: interactionData.scrollDepth,
              scrollSessions: interactionData.scrollSessions,
              timeOnPage: interactionData.timeOnPage,
              clicks: interactionData.clicks,
              uniqueElements: interactionData.uniqueElements,
            },
            deviceId,
            ipAddress: clientIP,
            userAgent,
          });
          break;

        case "REGISTRATION_PATTERN":
          if (interactionData?.email) {
            await EnhancedAnalyticsService.trackRegistrationPattern({
              email: interactionData.email,
              ipAddress: clientIP,
              deviceId,
              userAgent,
              action: interactionData.action,
              failureReason: interactionData.failureReason,
              isReturningIP: interactionData.isReturningIP,
              isReturningDevice: interactionData.isReturningDevice,
            });
          }
          break;

        default:
          // Handle general user behavior events
          await UserBehaviorService.trackBehaviorEvent({
            userId,
            sessionId: sessionId || "unknown",
            eventType,
            pageUrl,
            referrerUrl,
            elementId,
            elementType,
            elementText,
            interactionData,
            deviceId,
            ipAddress: clientIP,
            userAgent,
          });
          break;
      }

      processedEvents.push(event);
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedEvents.length} events`,
      processedCount: processedEvents.length,
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error processing behavior events:", error);

    // Don't log JSON parse errors - they're expected client-side issues

    // Log to database - user could email about "behavior tracking not working"
    const userMessage = logError({
      code: "BEHAVIOR_ANALYTICS_TRACK_FAILED",
      userId: session?.user?.id,
      route: "/api/analytics/behavior",
      method: "POST",
      error,
      metadata: {
        eventCount: body?.events?.length,
        note: "Failed to process behavior events",
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
    const sessionId = searchParams.get("sessionId");
    const eventType = searchParams.get("eventType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const deviceId = searchParams.get("deviceId");

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
      events,
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error getting behavior analytics:", error);

    // Log to database - user could email about "can't load behavior analytics"
    const userMessage = logError({
      code: "BEHAVIOR_ANALYTICS_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/analytics/behavior",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch behavior analytics",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

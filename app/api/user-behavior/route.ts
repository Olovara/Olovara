import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { MouseMovementAnalyzer, FraudDetectionService } from "@/lib/analytics";
import { getIPInfo, checkIPSuspicious } from "@/lib/ipinfo";
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
      eventType,
      pageUrl,
      referrerUrl,
      elementId,
      elementType,
      elementText,
      interactionData,
      mouseX,
      mouseY,
      deviceId,
      userId,
    } = body;

    // Validate required fields
    if (!sessionId || !eventType || !pageUrl) {
      return NextResponse.json(
        { error: "Session ID, event type, and page URL are required" },
        { status: 400 }
      );
    }

    // Get client IP
    const clientIP =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      req.ip ||
      "unknown";

    // Enhanced IP analysis for fraud detection
    let ipAnalysis = null;
    let locationData = null;
    let isProxy = false;
    let suspiciousReasons: string[] = [];

    try {
      // Get detailed IP information
      const ipInfo = await getIPInfo(clientIP);
      const suspiciousCheck = await checkIPSuspicious(clientIP);

      ipAnalysis = {
        ip: ipInfo.ip,
        country: ipInfo.country,
        countryCode: ipInfo.country_code,
        city: ipInfo.city,
        region: ipInfo.region,
        timezone: ipInfo.timezone,
        org: ipInfo.org,
        asn: ipInfo.asn,
        asName: ipInfo.as_name,
        hostname: ipInfo.hostname,
        anycast: ipInfo.anycast,
        continent: ipInfo.continent,
      };

      locationData = {
        country: ipInfo.country,
        countryCode: ipInfo.country_code,
        city: ipInfo.city,
        region: ipInfo.region,
        timezone: ipInfo.timezone,
        continent: ipInfo.continent,
      };

      isProxy = suspiciousCheck.isSuspicious;
      suspiciousReasons = suspiciousCheck.reasons;

      // Create fraud event for suspicious IP
      if (isProxy && userId) {
        await FraudDetectionService.createFraudEvent({
          userId,
          eventType: "SUSPICIOUS_IP_BEHAVIOR",
          severity: "MEDIUM",
          description: `Suspicious IP during user behavior: ${suspiciousReasons.join(", ")}`,
          evidence: {
            ip: clientIP,
            ipAnalysis,
            suspiciousReasons,
            deviceId,
            sessionId,
            eventType,
            pageUrl,
          },
          ipAddress: clientIP,
          userAgent: req.headers.get("user-agent") || undefined,
        });
      }
    } catch (error) {
      console.warn("Error analyzing IP for behavior tracking:", error);
      // Continue without IP analysis if it fails
    }

    let suspiciousBehavior = false;
    let botProbability = 0;
    let riskScore = 0;
    let movementPattern = "NATURAL";

    // Enhanced analysis for mouse movement events
    if (eventType === "MOUSE_MOVEMENT" && interactionData?.movements) {
      const analysis = MouseMovementAnalyzer.analyzeMovementPattern(
        interactionData.movements
      );

      suspiciousBehavior = analysis.botProbability > 0.7;
      botProbability = analysis.botProbability;
      movementPattern = analysis.pattern;
      riskScore = analysis.botProbability;

      // Create fraud event if suspicious behavior detected
      if (suspiciousBehavior && userId) {
        await FraudDetectionService.createFraudEvent({
          userId,
          eventType: "SUSPICIOUS_MOUSE_BEHAVIOR",
          severity: "MEDIUM",
          description: `Suspicious mouse movement pattern detected: ${analysis.pattern}`,
          evidence: {
            botProbability: analysis.botProbability,
            riskFactors: analysis.riskFactors,
            movementAnalysis: analysis.analysis,
            sessionId,
            deviceId,
            ipAnalysis,
            locationData,
          },
          ipAddress: clientIP,
          userAgent: req.headers.get("user-agent") || undefined,
        });
      }
    }

    // Create user behavior event with enhanced data
    const behaviorEvent = await db.userBehaviorEvent.create({
      data: {
        userId: userId || null,
        sessionId,
        eventType,
        pageUrl,
        referrerUrl: referrerUrl || null,
        elementId: elementId || null,
        elementType: elementType || null,
        elementText: elementText || null,
        interactionData: interactionData || null,

        // Mouse movement specific data
        mouseX: mouseX || null,
        mouseY: mouseY || null,
        mouseVelocity: interactionData?.velocity || null,
        mouseAcceleration: interactionData?.acceleration || null,
        mouseDirection: interactionData?.direction || null,
        mouseDistance: interactionData?.distance || null,
        mousePauseTime: interactionData?.pauseTime || null,

        // Pattern analysis
        movementPattern:
          eventType === "MOUSE_MOVEMENT" ? movementPattern : null,
        clickPattern: eventType === "CLICK" ? interactionData?.pattern : null,
        scrollPattern: eventType === "SCROLL" ? interactionData?.pattern : null,

        // Device and location with enhanced data
        deviceId: deviceId || null,
        ipAddress: clientIP,
        userAgent: req.headers.get("user-agent"),
        location: locationData, // Enhanced location data from IP geolocation

        // Fraud detection flags
        suspiciousBehavior: suspiciousBehavior || isProxy, // Include IP-based suspicion
        botProbability,
        riskScore: Math.max(riskScore, isProxy ? 0.3 : 0), // Boost risk score for proxy IPs
      },
    });

    return NextResponse.json({
      success: true,
      event: behaviorEvent,
      analysis:
        eventType === "MOUSE_MOVEMENT"
          ? {
              pattern: movementPattern,
              botProbability,
              suspiciousBehavior,
              riskScore,
            }
          : null,
      ipAnalysis: {
        isProxy,
        suspiciousReasons,
        location: locationData,
      },
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error tracking user behavior:", error);

    // Log to database - user could email about "behavior not being tracked"
    const userMessage = logError({
      code: "USER_BEHAVIOR_TRACK_FAILED",
      userId: session?.user?.id || body?.userId,
      route: "/api/user-behavior",
      method: "POST",
      error,
      metadata: {
        eventType: body?.eventType,
        sessionId: body?.sessionId,
        pageUrl: body?.pageUrl,
        note: "Failed to track user behavior",
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
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const userId = searchParams.get("userId");
    const deviceId = searchParams.get("deviceId");

    if (!sessionId && !userId && !deviceId) {
      return NextResponse.json(
        { error: "Session ID, user ID, or device ID is required" },
        { status: 400 }
      );
    }

    // Build query
    const where: any = {};
    if (sessionId) where.sessionId = sessionId;
    if (userId) where.userId = userId;
    if (deviceId) where.deviceId = deviceId;

    // Get behavior events
    const events = await db.userBehaviorEvent.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: 100, // Limit to recent events
    });

    // Analyze patterns if mouse movements are present
    const mouseMovements = events.filter(
      (e) => e.eventType === "MOUSE_MOVEMENT"
    );
    let sessionAnalysis = null;

    if (mouseMovements.length > 0) {
      const movements = mouseMovements.map((e) => ({
        x: e.mouseX || 0,
        y: e.mouseY || 0,
        timestamp: e.timestamp.getTime(),
      }));

      sessionAnalysis = MouseMovementAnalyzer.analyzeMovementPattern(movements);
    }

    // Calculate session statistics
    const sessionStats = {
      totalEvents: events.length,
      eventTypes: events.reduce(
        (acc, e) => {
          acc[e.eventType] = (acc[e.eventType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      suspiciousEvents: events.filter((e) => e.suspiciousBehavior).length,
      averageRiskScore:
        events.length > 0
          ? events.reduce((sum, e) => sum + (e.riskScore || 0), 0) /
            events.length
          : 0,
      sessionAnalysis,
    };

    return NextResponse.json({
      success: true,
      events,
      sessionStats,
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error getting user behavior:", error);

    // Log to database - user could email about "can't see behavior data"
    const userMessage = logError({
      code: "USER_BEHAVIOR_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/user-behavior",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch user behavior",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

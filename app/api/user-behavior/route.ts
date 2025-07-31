import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { MouseMovementAnalyzer, FraudDetectionService } from "@/lib/analytics";

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
      mouseX,
      mouseY,
      deviceId,
      userId
    } = body;

    // Validate required fields
    if (!sessionId || !eventType || !pageUrl) {
      return NextResponse.json(
        { error: "Session ID, event type, and page URL are required" },
        { status: 400 }
      );
    }

    // Get client IP
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                    req.headers.get('x-real-ip') || 
                    req.ip || 'unknown';

    let suspiciousBehavior = false;
    let botProbability = 0;
    let riskScore = 0;
    let movementPattern = 'NATURAL';

    // Enhanced analysis for mouse movement events
    if (eventType === 'MOUSE_MOVEMENT' && interactionData?.movements) {
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
          eventType: 'SUSPICIOUS_MOUSE_BEHAVIOR',
          severity: 'MEDIUM',
          description: `Suspicious mouse movement pattern detected: ${analysis.pattern}`,
          evidence: {
            botProbability: analysis.botProbability,
            riskFactors: analysis.riskFactors,
            movementAnalysis: analysis.analysis,
            sessionId,
            deviceId,
          },
          ipAddress: clientIP,
          userAgent: req.headers.get('user-agent'),
        });
      }
    }

    // Create user behavior event
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
        movementPattern: eventType === 'MOUSE_MOVEMENT' ? movementPattern : null,
        clickPattern: eventType === 'CLICK' ? interactionData?.pattern : null,
        scrollPattern: eventType === 'SCROLL' ? interactionData?.pattern : null,
        
        // Device and location
        deviceId: deviceId || null,
        ipAddress: clientIP,
        userAgent: req.headers.get('user-agent'),
        
        // Fraud detection flags
        suspiciousBehavior,
        botProbability,
        riskScore,
      }
    });

    return NextResponse.json({
      success: true,
      event: behaviorEvent,
      analysis: eventType === 'MOUSE_MOVEMENT' ? {
        pattern: movementPattern,
        botProbability,
        suspiciousBehavior,
        riskScore
      } : null
    });

  } catch (error) {
    console.error('Error tracking user behavior:', error);
    return NextResponse.json(
      { error: "Failed to track user behavior" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');
    const deviceId = searchParams.get('deviceId');

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
      orderBy: { timestamp: 'desc' },
      take: 100, // Limit to recent events
    });

    // Analyze patterns if mouse movements are present
    const mouseMovements = events.filter(e => e.eventType === 'MOUSE_MOVEMENT');
    let sessionAnalysis = null;

    if (mouseMovements.length > 0) {
      const movements = mouseMovements.map(e => ({
        x: e.mouseX || 0,
        y: e.mouseY || 0,
        timestamp: e.timestamp.getTime(),
      }));

      sessionAnalysis = MouseMovementAnalyzer.analyzeMovementPattern(movements);
    }

    // Calculate session statistics
    const sessionStats = {
      totalEvents: events.length,
      eventTypes: events.reduce((acc, e) => {
        acc[e.eventType] = (acc[e.eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      suspiciousEvents: events.filter(e => e.suspiciousBehavior).length,
      averageRiskScore: events.length > 0 
        ? events.reduce((sum, e) => sum + (e.riskScore || 0), 0) / events.length 
        : 0,
      sessionAnalysis,
    };

    return NextResponse.json({
      success: true,
      events,
      sessionStats
    });

  } catch (error) {
    console.error('Error getting user behavior:', error);
    return NextResponse.json(
      { error: "Failed to get user behavior" },
      { status: 500 }
    );
  }
} 
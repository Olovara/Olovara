import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { FraudDetectionService } from "@/lib/analytics";
import { hasPermission } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    // Only users with VIEW_FRAUD_DETECTION permission can access fraud detection
    if (!session?.user?.id || !(await hasPermission(session.user.id, 'VIEW_FRAUD_DETECTION'))) {
      return NextResponse.json(
        { error: "Unauthorized - Fraud detection access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const eventType = searchParams.get('eventType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get fraud events
    const events = await FraudDetectionService.getFraudEvents({
      status: status || undefined,
      severity: severity || undefined,
      eventType: eventType || undefined,
      limit,
      offset
    });

    return NextResponse.json({
      success: true,
      events,
      pagination: {
        limit,
        offset,
        hasMore: events.length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching fraud events:', error);
    return NextResponse.json(
      { error: "Failed to fetch fraud events" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    // Only users with CREATE_FRAUD_EVENTS permission can create fraud events
    if (!session?.user?.id || !(await hasPermission(session.user.id, 'CREATE_FRAUD_EVENTS'))) {
      return NextResponse.json(
        { error: "Unauthorized - Fraud event creation access required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      userId,
      eventType,
      severity,
      description,
      evidence,
      ipAddress,
      userAgent,
      orderId,
      productId,
      sellerId,
      actionsTaken
    } = body;

    // Validate required fields
    if (!eventType || !severity || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create fraud event
    const event = await FraudDetectionService.createFraudEvent({
      userId,
      eventType,
      severity,
      description,
      evidence,
      ipAddress,
      userAgent,
      orderId,
      productId,
      sellerId,
      actionsTaken
    });

    return NextResponse.json({
      success: true,
      message: "Fraud event created successfully",
      event
    });

  } catch (error) {
    console.error('Error creating fraud event:', error);
    return NextResponse.json(
      { error: "Failed to create fraud event" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    
    // Only users with MANAGE_FRAUD_DETECTION permission can update fraud events
    if (!session?.user?.id || !(await hasPermission(session.user.id, 'MANAGE_FRAUD_DETECTION'))) {
      return NextResponse.json(
        { error: "Unauthorized - Fraud detection management access required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { eventId, status, resolutionNotes, actionsTaken } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Update fraud event
    const updatedEvent = await db.fraudDetectionEvent.update({
      where: { id: eventId },
      data: {
        status: status || undefined,
        resolutionNotes: resolutionNotes || undefined,
        actionsTaken: actionsTaken || undefined,
        resolvedBy: session.user.id,
        resolvedAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: "Fraud event updated successfully",
      event: updatedEvent
    });

  } catch (error) {
    console.error('Error updating fraud event:', error);
    return NextResponse.json(
      { error: "Failed to update fraud event" },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { FraudDetectionService } from "@/lib/analytics";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";

export async function GET(req: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();

    // Only users with VIEW_FRAUD_DETECTION permission can access fraud detection
    if (
      !session?.user?.id ||
      !(await hasPermission(session.user.id, "VIEW_FRAUD_DETECTION"))
    ) {
      return NextResponse.json(
        { error: "Unauthorized - Fraud detection access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");
    const eventType = searchParams.get("eventType");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get fraud events
    const events = await FraudDetectionService.getFraudEvents({
      status: status || undefined,
      severity: severity || undefined,
      eventType: eventType || undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      events,
      pagination: {
        limit,
        offset,
        hasMore: events.length === limit,
      },
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching fraud events:", error);

    // Log to database - admin could email about "can't load fraud events"
    const userMessage = logError({
      code: "FRAUD_EVENTS_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/analytics/fraud",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch fraud events",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();

    // Only users with CREATE_FRAUD_EVENTS permission can create fraud events
    if (
      !session?.user?.id ||
      !(await hasPermission(session.user.id, "CREATE_FRAUD_EVENTS"))
    ) {
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
      actionsTaken,
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
      actionsTaken,
    });

    return NextResponse.json({
      success: true,
      message: "Fraud event created successfully",
      event,
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error creating fraud event:", error);

    // Don't log validation errors - they're expected client-side issues

    // Log to database - admin could email about "couldn't create fraud event"
    const userMessage = logError({
      code: "FRAUD_EVENT_CREATE_FAILED",
      userId: session?.user?.id,
      route: "/api/analytics/fraud",
      method: "POST",
      error,
      metadata: {
        eventType: body?.eventType,
        severity: body?.severity,
        note: "Failed to create fraud event",
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

    // Only users with MANAGE_FRAUD_DETECTION permission can update fraud events
    if (
      !session?.user?.id ||
      !(await hasPermission(session.user.id, "MANAGE_FRAUD_DETECTION"))
    ) {
      return NextResponse.json(
        { error: "Unauthorized - Fraud detection management access required" },
        { status: 401 }
      );
    }

    body = await req.json();
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
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Fraud event updated successfully",
      event: updatedEvent,
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error updating fraud event:", error);

    // Don't log validation errors - they're expected client-side issues

    // Log to database - admin could email about "couldn't update fraud event"
    const userMessage = logError({
      code: "FRAUD_EVENT_UPDATE_FAILED",
      userId: session?.user?.id,
      route: "/api/analytics/fraud",
      method: "PATCH",
      error,
      metadata: {
        eventId: body?.eventId,
        note: "Failed to update fraud event",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

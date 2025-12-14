import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

// This is a simple endpoint that will be called to trigger session updates
// The actual WebSocket logic is handled in the server.js file
export async function POST(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let body: any = null;

  try {
    body = await request.json();
    const { userId, updatedBy, reason } = body;

    if (!userId || !updatedBy || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the global emitSessionUpdate function from the server
    const emitSessionUpdate = (global as any).emitSessionUpdate;

    if (typeof emitSessionUpdate === "function") {
      const success = emitSessionUpdate(userId, updatedBy, reason);

      if (success) {
        console.log(`Session update sent to user ${userId}`);
        return NextResponse.json({ success: true });
      } else {
        console.log(`User ${userId} is not currently online`);
        return NextResponse.json({
          success: false,
          message: "User is not currently online",
        });
      }
    } else {
      console.error("emitSessionUpdate function not available");
      return NextResponse.json(
        { error: "WebSocket server not available" },
        { status: 500 }
      );
    }
  } catch (error) {
    // Log to console (always happens)
    console.error("Error in session update API:", error);

    // Don't log validation errors - they're expected client-side issues

    // Log to database - user could email about "session update not working"
    const userMessage = logError({
      code: "SESSION_UPDATE_FAILED",
      userId: body?.userId,
      route: "/api/socket/session-update",
      method: "POST",
      error,
      metadata: {
        userId: body?.userId,
        updatedBy: body?.updatedBy,
        reason: body?.reason,
        note: "Failed to update session via WebSocket",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

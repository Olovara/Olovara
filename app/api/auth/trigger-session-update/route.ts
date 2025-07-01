import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateUserSession } from "@/lib/session-update";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { reason = "Onboarding task completed" } = await request.json();

    // Update the user's session to trigger a refresh
    await updateUserSession(session.user.id);

    // Trigger WebSocket notification for real-time updates
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/socket/session-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          updatedBy: session.user.id,
          reason: reason
        }),
      });
    } catch (websocketError) {
      console.error("WebSocket notification failed:", websocketError);
      // Don't fail the request if WebSocket fails
    }

    return NextResponse.json({ 
      success: true, 
      message: "Session update triggered successfully" 
    });

  } catch (error) {
    console.error("Error triggering session update:", error);
    return NextResponse.json(
      { error: "Failed to trigger session update" }, 
      { status: 500 }
    );
  }
} 
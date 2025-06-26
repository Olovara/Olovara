import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateUserSession } from "@/lib/session-update";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Update the user's session to trigger a refresh
    await updateUserSession(session.user.id);

    return NextResponse.json({ 
      success: true, 
      message: "Session refreshed successfully" 
    });

  } catch (error) {
    console.error("Error refreshing session:", error);
    return NextResponse.json(
      { error: "Failed to refresh session" }, 
      { status: 500 }
    );
  }
} 
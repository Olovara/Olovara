import { NextRequest, NextResponse } from "next/server";

// This is a simple endpoint that will be called to trigger session updates
// The actual WebSocket logic is handled in the server.js file
export async function POST(request: NextRequest) {
  try {
    const { userId, updatedBy, reason } = await request.json();

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
          message: "User is not currently online" 
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
    console.error("Error in session update API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
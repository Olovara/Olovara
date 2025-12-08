import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * API endpoint to clear permission cache
 * This is called after role/permission changes to force a refresh
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Return success - the client will clear localStorage cache
    // The PermissionProvider will fetch fresh data on next render
    return NextResponse.json({ 
      success: true,
      message: "Cache clear requested. Client should clear localStorage and refresh permissions."
    });

  } catch (error) {
    console.error("Error in clear-cache endpoint:", error);
    return NextResponse.json(
      { error: "Failed to clear cache" }, 
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { logError } from "@/lib/error-logger";

/**
 * API endpoint to clear permission cache
 * This is called after role/permission changes to force a refresh
 */
export async function POST(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Return success - the client will clear localStorage cache
    // The PermissionProvider will fetch fresh data on next render
    return NextResponse.json({
      success: true,
      message:
        "Cache clear requested. Client should clear localStorage and refresh permissions.",
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error in clear-cache endpoint:", error);

    // Log to database - user could email about "can't clear cache"
    const userMessage = logError({
      code: "AUTH_CLEAR_CACHE_FAILED",
      userId: session?.user?.id,
      route: "/api/auth/clear-cache",
      method: "POST",
      error,
      metadata: {
        note: "Failed to clear permission cache",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

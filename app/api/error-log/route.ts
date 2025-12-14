import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { logError } from "@/lib/error-logger";

/**
 * API endpoint to log errors from client-side code
 * This allows client components to log errors to the database
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();

    const { code, error, metadata, route, method } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Error code is required" },
        { status: 400 }
      );
    }

    // Log the error
    const userMessage = logError({
      code,
      userId: session?.user?.id,
      route: route || "/client-side",
      method: method || "POST",
      error: error ? new Error(error.message || String(error)) : undefined,
      metadata: {
        ...metadata,
        isClientSide: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: userMessage,
    });
  } catch (error) {
    console.error("Error logging endpoint failed:", error);
    return NextResponse.json({ error: "Failed to log error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/error-logger";
import { auth } from "@/auth";

// API endpoint for client-side error logging
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();

    const { code, message, metadata } = body;

    // Validate required fields
    if (!code) {
      return NextResponse.json(
        { error: "Missing error code" },
        { status: 400 }
      );
    }

    // Log the error (fire-and-forget to DB, always logs to console)
    logError({
      code,
      userId: session?.user?.id,
      route: metadata?.route || "/client",
      method: "CLIENT",
      message,
      metadata: {
        ...metadata,
        source: "client",
        userAgent: req.headers.get("user-agent"),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LOG_ERROR_API] Failed to process error log:", error);
    return NextResponse.json({ error: "Failed to log error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/error-logger";

export async function GET(req: NextRequest) {
  try {
    // Get client IP from various headers
    const clientIP =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      req.ip ||
      "unknown";

    return NextResponse.json({
      ip: clientIP,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error getting client IP:", error);

    // Log to database - user could email about "IP detection not working"
    logError({
      code: "IP_DETECTION_FAILED",
      userId: undefined, // Public route
      route: "/api/ip",
      method: "GET",
      error,
      metadata: {
        note: "Failed to get client IP",
      },
    });

    return NextResponse.json({
      ip: "unknown",
      timestamp: new Date().toISOString(),
    });
  }
}

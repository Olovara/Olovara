import { NextRequest, NextResponse } from "next/server";

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
    console.error("Error getting client IP:", error);
    return NextResponse.json({
      ip: "unknown",
      timestamp: new Date().toISOString(),
    });
  }
}

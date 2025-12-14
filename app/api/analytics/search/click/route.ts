import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { SearchAnalyticsService } from "@/lib/analytics";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();
    body = await req.json();

    const {
      searchId,
      clickedResult,
      clickProductId, // Fixed: use clickProductId (not clickedProductId)
      clickedSellerId,
      timeToClick,
    } = body;

    // Validate required fields
    if (!searchId) {
      return NextResponse.json(
        { error: "Missing required fields: searchId is required" },
        { status: 400 }
      );
    }

    // Track the search click
    const updatedSearch = await SearchAnalyticsService.trackSearchClick({
      searchId,
      clickedResult,
      clickProductId, // Fixed: use clickProductId (not clickedProductId)
      clickedSellerId,
      timeToClick,
    });

    return NextResponse.json({
      success: true,
      searchAnalytics: updatedSearch,
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error tracking search click:", error);

    // Don't log validation errors - they're expected client-side issues

    // Log to database - user could email about "search click tracking not working"
    const userMessage = logError({
      code: "SEARCH_CLICK_TRACK_FAILED",
      userId: session?.user?.id,
      route: "/api/analytics/search/click",
      method: "POST",
      error,
      metadata: {
        searchId: body?.searchId,
        clickProductId: body?.clickProductId,
        note: "Failed to track search click",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

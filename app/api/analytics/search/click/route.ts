import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { SearchAnalyticsService } from "@/lib/analytics";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    
    const {
      searchId,
      clickedResult,
      clickedProductId,
      clickedSellerId,
      timeToClick
    } = body;

    // Validate required fields
    if (!searchId || !clickedResult) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Track the search click
    const updatedSearch = await SearchAnalyticsService.trackSearchClick({
      searchId,
      clickedResult,
      clickedProductId,
      clickedSellerId,
      timeToClick,
    });

    return NextResponse.json({
      success: true,
      searchAnalytics: updatedSearch
    });

  } catch (error) {
    console.error('Error tracking search click:', error);
    return NextResponse.json(
      { error: "Failed to track search click" },
      { status: 500 }
    );
  }
} 
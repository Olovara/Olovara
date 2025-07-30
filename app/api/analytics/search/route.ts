import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { SearchAnalyticsService } from "@/lib/analytics";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    
    const {
      sessionId,
      query,
      searchType,
      filters,
      sortBy,
      resultsCount,
      resultsShown,
      searchTime,
      deviceId,
      ipAddress,
      userAgent,
      location,
      timestamp
    } = body;

    // Validate required fields
    if (!sessionId || !query || !searchType || resultsCount === undefined || resultsShown === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get client IP if not provided
    const clientIP = ipAddress || req.headers.get('x-forwarded-for')?.split(',')[0] || 
                    req.headers.get('x-real-ip') || 
                    req.ip || 'unknown';

    // Track the search
    const searchAnalytics = await SearchAnalyticsService.trackSearch({
      userId: session?.user?.id,
      sessionId,
      query,
      searchType,
      filters,
      sortBy,
      resultsCount,
      resultsShown,
      searchTime,
      deviceId,
      ipAddress: clientIP,
      userAgent: userAgent || req.headers.get('user-agent'),
      location,
    });

    return NextResponse.json({
      success: true,
      searchId: searchAnalytics.id,
      searchAnalytics
    });

  } catch (error) {
    console.error('Error tracking search:', error);
    return NextResponse.json(
      { error: "Failed to track search" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    const searchType = searchParams.get('searchType');
    const query = searchParams.get('query');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const days = parseInt(searchParams.get('days') || '7');

    // Parse dates
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    // Get search analytics
    const searches = await SearchAnalyticsService.getSearchAnalytics({
      userId: userId || session.user.id,
      sessionId: sessionId || undefined,
      searchType: searchType || undefined,
      startDate: start,
      endDate: end,
      query: query || undefined,
    });

    // Get popular searches if no specific filters
    const popularSearches = !userId && !sessionId && !searchType && !query && !startDate && !endDate
      ? await SearchAnalyticsService.getPopularSearches(days)
      : [];

    return NextResponse.json({
      success: true,
      searches,
      popularSearches
    });

  } catch (error) {
    console.error('Error getting search analytics:', error);
    return NextResponse.json(
      { error: "Failed to get search analytics" },
      { status: 500 }
    );
  }
} 
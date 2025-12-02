import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getUserAnalytics } from "@/lib/ipinfo";
import { 
  truncateIPToSubnet, 
  normalizeSearchQuery, 
  getDeviceType,
  extractLocationData 
} from "@/lib/search-analytics";

/**
 * API Route for tracking search analytics
 * Tracks product searches with all required analytics data
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    // Handle empty or malformed request body
    let body;
    try {
      const text = await req.text();
      if (!text || text.trim() === '') {
        return NextResponse.json(
          { error: "Request body is empty" },
          { status: 400 }
        );
      }
      body = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    const {
      searchQuery,           // Raw search query (required)
      resultCount,           // Total results returned (required)
      clickProductId,        // Product ID if clicked (optional)
      deviceId,             // Device ID from cookie/localStorage (required)
      sessionId,            // Session ID (optional for advanced)
      searchContext,        // Where they searched from (optional)
      deviceType,           // Device type from client (optional, will be determined if not provided)
    } = body || {};

    // Validate required fields
    if (!searchQuery || !deviceId || resultCount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: searchQuery, deviceId, and resultCount are required" },
        { status: 400 }
      );
    }

    // Get client IP and truncate to /24 for privacy
    const forwarded = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    const clientIP = forwarded?.split(',')[0] || realIP || req.ip || 'unknown';
    const truncatedIP = truncateIPToSubnet(clientIP);

    // Get user agent
    const userAgent = req.headers.get('user-agent') || '';

    // Determine device type (use provided or detect from user agent)
    const detectedDeviceType = deviceType || getDeviceType(userAgent);

    // Get location data (country and region/state only)
    let locationData = null;
    try {
      const fullLocationData = await getUserAnalytics(clientIP);
      locationData = extractLocationData(fullLocationData);
    } catch (error) {
      console.warn('Failed to get location data for search analytics:', error);
    }

    // Normalize the search query
    const normalizedQuery = normalizeSearchQuery(searchQuery);

    // Create search analytics record
    const searchAnalytics = await db.searchAnalytics.create({
      data: {
        // Core required fields
        searchQuery: searchQuery.trim(),
        normalizedQuery,
        resultCount: Number(resultCount),
        clickProductId: clickProductId || null,
        deviceId,
        
        // Device and location
        deviceType: detectedDeviceType,
        ipAddress: truncatedIP,
        userAgent: userAgent || null,
        location: locationData,
        
        // Context and metadata
        searchContext: searchContext || null,
        
        // User info (only if logged in)
        userId: session?.user?.id || null,
        
        // Advanced fields (optional)
        sessionId: sessionId || null,
        queryLength: searchQuery.trim().length,
        searchType: "PRODUCT", // Default to product search
      },
    });

    return NextResponse.json({
      success: true,
      id: searchAnalytics.id
    });

  } catch (error) {
    console.error('Error tracking search analytics:', error);
    return NextResponse.json(
      { error: "Failed to track search analytics" },
      { status: 500 }
    );
  }
}

/**
 * PATCH endpoint to update search analytics with click data
 * Called when user clicks a product after searching
 */
export async function PATCH(req: NextRequest) {
  try {
    let body;
    try {
      const text = await req.text();
      if (!text || text.trim() === '') {
        return NextResponse.json(
          { error: "Request body is empty" },
          { status: 400 }
        );
      }
      body = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    const {
      clickProductId,  // Product ID that was clicked (required)
      deviceId,        // Device ID to find the search record (required)
      searchQuery,    // Optional: search query to match (helps find the right record)
    } = body || {};

    if (!clickProductId || !deviceId) {
      return NextResponse.json(
        { error: "Missing required fields: clickProductId and deviceId are required" },
        { status: 400 }
      );
    }

    // Find the most recent search analytics record for this device
    // that matches the search query (if provided) and doesn't have a clickProductId yet
    const whereClause: any = {
      deviceId,
      clickProductId: null, // Only update records that haven't been clicked yet
    };

    if (searchQuery) {
      whereClause.searchQuery = searchQuery.trim();
    }

    // Find the most recent matching search record
    const recentSearch = await db.searchAnalytics.findFirst({
      where: whereClause,
      orderBy: {
        timestamp: 'desc',
      },
    });

    let updated = false;
    if (recentSearch) {
      await db.searchAnalytics.update({
        where: { id: recentSearch.id },
        data: { clickProductId },
      });
      updated = true;
    } else if (searchQuery) {
      // If no exact match, try to find any recent search (within last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const fallbackSearch = await db.searchAnalytics.findFirst({
        where: {
          deviceId,
          clickProductId: null,
          timestamp: {
            gte: fiveMinutesAgo,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      if (fallbackSearch) {
        await db.searchAnalytics.update({
          where: { id: fallbackSearch.id },
          data: { clickProductId },
        });
        updated = true;
      }
    }

    return NextResponse.json({
      success: true,
      updated,
    });

  } catch (error) {
    console.error('Error updating search analytics with click:', error);
    return NextResponse.json(
      { error: "Failed to update search analytics" },
      { status: 500 }
    );
  }
}

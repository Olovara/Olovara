import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ProductInteractionService } from "@/lib/analytics";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    
    const {
      sessionId,
      productId,
      interactionType,
      interactionData,
      timeOnProduct,
      imagesViewed,
      descriptionRead,
      reviewsViewed,
      sellerInfoViewed,
      sourceType,
      sourceId,
      referrerUrl,
      deviceId,
      ipAddress,
      userAgent,
      location,
      timestamp
    } = body;

    // Validate required fields
    if (!sessionId || !productId || !interactionType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get client IP if not provided
    const clientIP = ipAddress || req.headers.get('x-forwarded-for')?.split(',')[0] || 
                    req.headers.get('x-real-ip') || 
                    req.ip || 'unknown';

    // Track the product interaction
    const interaction = await ProductInteractionService.trackProductInteraction({
      userId: session?.user?.id,
      productId,
      sessionId,
      interactionType,
      interactionData,
      timeOnProduct,
      imagesViewed,
      descriptionRead,
      reviewsViewed,
      sellerInfoViewed,
      sourceType,
      sourceId,
      referrerUrl,
      deviceId,
      ipAddress: clientIP,
      userAgent: userAgent || req.headers.get('user-agent'),
      location,
    });

    return NextResponse.json({
      success: true,
      interaction
    });

  } catch (error) {
    console.error('Error tracking product interaction:', error);
    return NextResponse.json(
      { error: "Failed to track product interaction" },
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
    const productId = searchParams.get('productId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const days = parseInt(searchParams.get('days') || '7');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Parse dates
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    if (productId) {
      // Get specific product analytics
      const productAnalytics = await ProductInteractionService.getProductAnalytics(productId, start, end);
      
      return NextResponse.json({
        success: true,
        productAnalytics
      });
    } else {
      // Get top products
      const topProducts = await ProductInteractionService.getTopProducts(days, limit);
      
      return NextResponse.json({
        success: true,
        topProducts
      });
    }

  } catch (error) {
    console.error('Error getting product interaction analytics:', error);
    return NextResponse.json(
      { error: "Failed to get product interaction analytics" },
      { status: 500 }
    );
  }
} 
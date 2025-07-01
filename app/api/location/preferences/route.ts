import { NextRequest, NextResponse } from 'next/server';
import { getUserLocationPreferences, getUserAnalytics } from '@/lib/ipinfo';

/**
 * GET /api/location/preferences
 * Get user location preferences based on IP address
 */
export async function GET(request: NextRequest) {
  try {
    // Get client IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const clientIP = forwarded?.split(',')[0] || realIP || request.ip || '';

    // Get location preferences
    const locationPreferences = await getUserLocationPreferences(clientIP);
    
    // Get analytics data (for fraud detection and analytics)
    const analytics = await getUserAnalytics(clientIP);

    return NextResponse.json({
      success: true,
      data: {
        locationPreferences,
        analytics,
        clientIP
      }
    });
  } catch (error) {
    console.error('Error getting location preferences:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get location preferences' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/location/preferences
 * Update user location preferences (for manual override)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { countryCode, currency } = body;

    // Validate input
    if (!countryCode || !currency) {
      return NextResponse.json(
        { success: false, error: 'Country code and currency are required' },
        { status: 400 }
      );
    }

    // Here you would typically save the user's manual preference to the database
    // For now, we'll just return the provided preferences
    return NextResponse.json({
      success: true,
      data: {
        locationPreferences: {
          countryCode,
          currency,
          isManualOverride: true
        }
      }
    });
  } catch (error) {
    console.error('Error updating location preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update location preferences' },
      { status: 500 }
    );
  }
} 
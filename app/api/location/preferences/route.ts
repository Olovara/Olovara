import { NextRequest, NextResponse } from 'next/server';
import { getUserLocationPreferences, getUserAnalytics } from '@/lib/ipinfo';
import { auth } from '@/auth';
import { db } from '@/lib/db';

/**
 * GET /api/location/preferences
 * Get user location preferences based on IP address
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // Get client IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const clientIP = forwarded?.split(',')[0] || realIP || request.ip || '';

    // Get location preferences
    const locationPreferences = await getUserLocationPreferences(clientIP);
    
    // Get analytics data (for fraud detection and analytics)
    const analytics = await getUserAnalytics(clientIP);

    // If user is logged in, update their preferences in the database
    if (session?.user?.id) {
      try {
        const updateData: any = {
          preferredCurrency: locationPreferences.currency,
          lastLoginIP: clientIP,
          lastLoginAt: new Date(),
        };

        // Only set signupIP if it's not already set
        const user = session.user as any;
        if (!user.signupIP) {
          updateData.signupIP = clientIP;
        }

        // Only set signupLocation if it's not already set
        if (!user.signupLocation) {
          updateData.signupLocation = {
            country: locationPreferences.countryCode,
            countryName: locationPreferences.countryName,
            continent: locationPreferences.continent,
          };
        }

        await db.user.update({
          where: { id: session.user.id },
          data: updateData,
        });
      } catch (error) {
        console.error('Error updating user location preferences:', error);
        // Don't fail the request if database update fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        locationPreferences,
        analytics,
        clientIP,
        isLoggedIn: !!session?.user?.id
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
    const session = await auth();
    const body = await request.json();
    const { countryCode, currency } = body;

    // Validate input
    if (!countryCode || !currency) {
      return NextResponse.json(
        { success: false, error: 'Country code and currency are required' },
        { status: 400 }
      );
    }

    // If user is logged in, save to database
    if (session?.user?.id) {
      try {
        await db.user.update({
          where: { id: session.user.id },
          data: {
            preferredCurrency: currency,
          },
        });
      } catch (error) {
        console.error('Error updating user preferences in database:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to update preferences in database' },
          { status: 500 }
        );
      }
    }

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
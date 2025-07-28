import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { FraudDetectionService } from "@/lib/analytics";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      deviceId,
      browser,
      os,
      screenRes,
      timezone,
      language,
      userAgent
    } = body;

    if (!deviceId) {
      return NextResponse.json(
        { error: "Device ID is required" },
        { status: 400 }
      );
    }

    // Get client IP address
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Track device fingerprint with fraud detection
    await FraudDetectionService.trackUserActivity({
      userId: session.user.id,
      action: 'DEVICE_FINGERPRINT',
      ipAddress,
      userAgent,
      deviceFingerprint: deviceId,
      success: true,
      details: {
        browser,
        os,
        screenRes,
        timezone,
        language
      }
    });

    return NextResponse.json({
      success: true,
      message: "Device fingerprint recorded successfully"
    });

  } catch (error) {
    console.error('Error recording device fingerprint:', error);
    return NextResponse.json(
      { error: "Failed to record device fingerprint" },
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
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json(
        { error: "Device ID is required" },
        { status: 400 }
      );
    }

    // Get device analysis
    const analysis = await FraudDetectionService.getDeviceAnalysis(deviceId);

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Error getting device analysis:', error);
    return NextResponse.json(
      { error: "Failed to get device analysis" },
      { status: 500 }
    );
  }
} 
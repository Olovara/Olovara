import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { FraudDetectionService } from "@/lib/analytics";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    
    const {
      deviceId,
      browser,
      os,
      screenRes,
      timezone,
      language,
      userAgent,
      userId
    } = body;

    // Validate required fields
    if (!deviceId) {
      return NextResponse.json(
        { error: "Device ID is required" },
        { status: 400 }
      );
    }

    // Get client IP
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                    req.headers.get('x-real-ip') || 
                    req.ip || 'unknown';

    // Check if device already exists
    const existingDevice = await db.deviceFingerprint.findFirst({
      where: { deviceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            createdAt: true,
            fraudScore: true,
            accountReputation: true,
          }
        }
      }
    });

    if (existingDevice) {
      // Update existing device record
      const updatedDevice = await db.deviceFingerprint.update({
        where: { id: existingDevice.id },
        data: {
          lastSeen: new Date(),
          ip: clientIP,
          userAgent: userAgent || req.headers.get('user-agent'),
          browser: browser || existingDevice.browser,
          os: os || existingDevice.os,
          screenRes: screenRes || existingDevice.screenRes,
          timezone: timezone || existingDevice.timezone,
          language: language || existingDevice.language,
        }
      });

      // If user is logged in and different from existing user, this could be suspicious
      if (userId && existingDevice.userId !== userId) {
        await FraudDetectionService.createFraudEvent({
          userId,
          eventType: 'DEVICE_SHARING',
          severity: 'MEDIUM',
          description: `Device ${deviceId} previously used by different user`,
          evidence: {
            existingUserId: existingDevice.userId,
            newUserId: userId,
            deviceId,
            ipAddress: clientIP,
          },
          ipAddress: clientIP,
          userAgent: userAgent || req.headers.get('user-agent'),
        });
      }

      return NextResponse.json({
        success: true,
        device: updatedDevice,
        isExisting: true,
        message: "Device fingerprint updated"
      });
    } else {
      // Create new device record
      const newDevice = await db.deviceFingerprint.create({
        data: {
          userId: userId || null,
          deviceId,
          ip: clientIP,
          userAgent: userAgent || req.headers.get('user-agent'),
          browser: browser || 'Unknown',
          os: os || 'Unknown',
          screenRes: screenRes || 'Unknown',
          timezone: timezone || 'Unknown',
          language: language || 'Unknown',
        }
      });

      return NextResponse.json({
        success: true,
        device: newDevice,
        isExisting: false,
        message: "New device fingerprint created"
      });
    }

  } catch (error) {
    console.error('Error processing device fingerprint:', error);
    return NextResponse.json(
      { error: "Failed to process device fingerprint" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json(
        { error: "Device ID is required" },
        { status: 400 }
      );
    }

    // Get all users associated with this device
    const deviceUsers = await db.deviceFingerprint.findMany({
      where: { deviceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            createdAt: true,
            fraudScore: true,
            accountReputation: true,
            numChargebacks: true,
            numRefunds: true,
            numDisputes: true,
          }
        }
      },
      orderBy: { lastSeen: 'desc' }
    });

    // Get device analysis for IP and location info
    let deviceAnalysis = null;
    try {
      deviceAnalysis = await FraudDetectionService.getDeviceAnalysis(deviceId);
    } catch (error) {
      console.warn('Could not get device analysis:', error);
    }

    // Calculate risk factors
    const riskFactors = {
      multipleAccounts: deviceUsers.length > 1,
      suspiciousUsers: deviceUsers.filter(u => 
        u.user && (u.user.fraudScore || 0) > 0.7
      ).length,
      chargebackUsers: deviceUsers.filter(u => 
        u.user && (u.user.numChargebacks || 0) > 0
      ).length,
      recentActivity: deviceUsers.some(u => 
        new Date(u.lastSeen).getTime() > Date.now() - 24 * 60 * 60 * 1000
      ),
    };

    // Calculate risk score
    let riskScore = 0;
    if (riskFactors.multipleAccounts) riskScore += 0.3;
    if (riskFactors.suspiciousUsers > 0) riskScore += 0.4;
    if (riskFactors.chargebackUsers > 0) riskScore += 0.2;
    if (riskFactors.recentActivity) riskScore += 0.1;

    const analysis = {
      isExistingDevice: deviceUsers.length > 0,
      firstSeen: deviceUsers.length > 0 ? deviceUsers[deviceUsers.length - 1].firstSeen : null,
      lastSeen: deviceUsers.length > 0 ? deviceUsers[0].lastSeen : null,
      associatedAccounts: deviceUsers.length,
      riskScore: Math.min(riskScore, 1.0),
      isProxy: deviceUsers.length > 0 ? deviceUsers[0].isProxy || false : false,
      location: deviceUsers.length > 0 ? deviceUsers[0].location || null : null,
      riskFactors,
      deviceUsers: deviceUsers.map(du => ({
        userId: du.userId,
        email: du.user?.email,
        username: du.user?.username,
        accountCreated: du.user?.createdAt,
        fraudScore: du.user?.fraudScore,
        accountReputation: du.user?.accountReputation,
        chargebacks: du.user?.numChargebacks,
        refunds: du.user?.numRefunds,
        disputes: du.user?.numDisputes,
        firstSeen: du.firstSeen,
        lastSeen: du.lastSeen,
      })),
    };

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
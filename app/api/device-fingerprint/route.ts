import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { FraudDetectionService } from "@/lib/analytics";
import { db } from "@/lib/db";

// Retry function for handling transaction conflicts
async function retryTransaction<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 100
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      // Only retry on transaction conflicts (P2034)
      if (error.code === 'P2034' && attempt < maxRetries) {
        console.warn(`Transaction conflict, retrying... (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

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

    // Use transaction with retry logic to handle concurrent updates
    const result = await retryTransaction(async () => {
      return await db.$transaction(async (tx) => {
        // Check if this specific user-device combination already exists
        const existingDevice = await tx.deviceFingerprint.findFirst({
          where: { 
            deviceId,
            userId: userId || undefined // Include userId in the search
          },
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
          // Update existing user-device record
          return await tx.deviceFingerprint.update({
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
            },
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
        } else {
          // Check if this device is used by other users (for fraud detection)
          const otherUsersOnDevice = await tx.deviceFingerprint.findMany({
            where: { 
              deviceId,
              userId: { not: undefined } // Only check for logged-in users
            },
            include: {
              user: true
            }
          });

          // Create new user-device record
          const newDevice = await tx.deviceFingerprint.create({
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
            },
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

          // If this device is used by other users, create fraud event
          if (otherUsersOnDevice.length > 0 && userId) {
            await FraudDetectionService.createFraudEvent({
              userId,
              eventType: 'DEVICE_SHARING',
              severity: 'MEDIUM',
              description: `Device ${deviceId} used by multiple accounts`,
              evidence: {
                existingUsers: otherUsersOnDevice.map(d => ({
                  userId: d.userId,
                  email: d.user?.email || null,
                  username: d.user?.username || null,
                })),
                newUserId: userId,
                deviceId,
                ipAddress: clientIP,
                totalUsersOnDevice: otherUsersOnDevice.length + 1,
              },
              ipAddress: clientIP,
              userAgent: userAgent || req.headers.get('user-agent'),
            });
          }

          return newDevice;
        }
      });
    });

    return NextResponse.json({
      success: true,
      device: result,
      isExisting: result.userId !== null,
      message: result.userId ? "Device fingerprint updated" : "New device fingerprint created"
    });

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
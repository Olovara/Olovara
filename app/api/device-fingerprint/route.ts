import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { FraudDetectionService } from "@/lib/analytics";
import { db } from "@/lib/db";
import { getIPInfo, checkIPSuspicious, getUserAnalytics } from "@/lib/ipinfo";

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

    // Enhanced IP analysis for fraud detection
    let ipAnalysis = null;
    let locationData = null;
    let isProxy = false;
    let suspiciousReasons: string[] = [];

    try {
      // Get detailed IP information
      const ipInfo = await getIPInfo(clientIP);
      const suspiciousCheck = await checkIPSuspicious(clientIP);
      
      ipAnalysis = {
        ip: ipInfo.ip,
        country: ipInfo.country,
        countryCode: ipInfo.country_code,
        city: ipInfo.city,
        region: ipInfo.region,
        timezone: ipInfo.timezone,
        org: ipInfo.org,
        asn: ipInfo.asn,
        asName: ipInfo.as_name,
        hostname: ipInfo.hostname,
        anycast: ipInfo.anycast,
        continent: ipInfo.continent,
      };

      locationData = {
        country: ipInfo.country,
        countryCode: ipInfo.country_code,
        city: ipInfo.city,
        region: ipInfo.region,
        timezone: ipInfo.timezone,
        continent: ipInfo.continent,
      };

      isProxy = suspiciousCheck.isSuspicious;
      suspiciousReasons = suspiciousCheck.reasons;

      // Create fraud event for suspicious IP
      if (isProxy && userId) {
        await FraudDetectionService.createFraudEvent({
          userId,
          eventType: 'SUSPICIOUS_IP',
          severity: 'MEDIUM',
          description: `Suspicious IP detected: ${suspiciousReasons.join(', ')}`,
          evidence: {
            ip: clientIP,
            ipAnalysis,
            suspiciousReasons,
            deviceId,
          },
          ipAddress: clientIP,
          userAgent: userAgent || req.headers.get('user-agent'),
        });
      }
    } catch (error) {
      console.warn('Error analyzing IP:', error);
      // Continue without IP analysis if it fails
    }

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
           // Update existing user-device record with enhanced data
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
               // Enhanced location and proxy detection
               location: locationData,
               isProxy: isProxy,
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

           // Create new user-device record with enhanced data
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
               // Enhanced location and proxy detection
               location: locationData,
               isProxy: isProxy,
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

           // If this device is used by other users, create fraud event (but check for existing events first)
           if (otherUsersOnDevice.length > 0 && userId) {
             // Check if we already have a recent DEVICE_SHARING event for this user-device combination
             const existingFraudEvent = await tx.fraudDetectionEvent.findFirst({
               where: {
                 userId,
                 eventType: 'DEVICE_SHARING',
                 createdAt: {
                   gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                 }
               }
             });

             // Only create fraud event if one doesn't already exist
             if (!existingFraudEvent) {
               // Create fraud event directly in the transaction to avoid race conditions
               await tx.fraudDetectionEvent.create({
                 data: {
                   userId,
                   eventType: 'DEVICE_SHARING',
                   severity: 'MEDIUM',
                   riskScore: 0.5,
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
                     ipAnalysis,
                   },
                   ipAddress: clientIP,
                   userAgent: userAgent || req.headers.get('user-agent'),
                   location: locationData,
                   status: 'OPEN',
                   actionsTaken: [],
                 }
               });
             }
           }

           return newDevice;
         }
       });
     });

    return NextResponse.json({
      success: true,
      device: result,
      isExisting: result.userId !== null,
      message: result.userId ? "Device fingerprint updated" : "New device fingerprint created",
      ipAnalysis: {
        isProxy,
        suspiciousReasons,
        location: locationData,
      }
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
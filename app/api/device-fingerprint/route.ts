import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { FraudDetectionService } from "@/lib/analytics";
import { db } from "@/lib/db";
import { getIPInfo, checkIPSuspicious, getUserAnalytics } from "@/lib/ipinfo";
import { logError } from "@/lib/error-logger";

export async function POST(req: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();

    // Handle empty or malformed request body
    try {
      const text = await req.text();
      if (!text || text.trim() === "") {
        return NextResponse.json(
          { error: "Request body is empty" },
          { status: 400 }
        );
      }
      body = JSON.parse(text);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const {
      deviceId,
      browser,
      os,
      screenRes,
      timezone,
      language,
      userAgent,
      userId,
    } = body;

    // Validate required fields
    if (!deviceId) {
      return NextResponse.json(
        { error: "Device ID is required" },
        { status: 400 }
      );
    }

    // Get client IP
    const clientIP =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      req.ip ||
      "unknown";

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
          eventType: "SUSPICIOUS_IP",
          severity: "MEDIUM",
          description: `Suspicious IP detected: ${suspiciousReasons.join(", ")}`,
          evidence: {
            ip: clientIP,
            ipAnalysis,
            suspiciousReasons,
            deviceId,
          },
          ipAddress: clientIP,
          userAgent: userAgent || req.headers.get("user-agent"),
        });
      }
    } catch (error) {
      console.warn("Error analyzing IP:", error);
      // Continue without IP analysis if it fails
    }

    // Use a simple approach without transactions to avoid P2028 errors
    let deviceRecord;

    try {
      // Try to create first (will fail if exists due to unique constraint)
      // Removed deviceId and userId from logs for security
      //console.log(`[DEBUG] Attempting to create new device fingerprint`);

      // Prepare the create data
      const createData: any = {
        userId: userId || null,
        deviceId,
        ip: clientIP,
        userAgent: userAgent || req.headers.get("user-agent"),
        browser: browser || "Unknown",
        os: os || "Unknown",
        screenRes: screenRes || "Unknown",
        timezone: timezone || "Unknown",
        language: language || "Unknown",
        location: locationData,
        isProxy: isProxy,
      };

      // Only include user relation if userId is provided
      const includeData = userId
        ? {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                createdAt: true,
                fraudScore: true,
                accountReputation: true,
              },
            },
          }
        : {};

      deviceRecord = await db.deviceFingerprint.create({
        data: createData,
        include: includeData,
      });

      // Removed deviceId and userId from logs for security
      {
        /*console.log(`[DEBUG] Device fingerprint created successfully:`, {
        action: 'created',
        id: deviceRecord.id
      });*/
      }
    } catch (createError: any) {
      // If creation fails due to unique constraint, try to update
      if (createError.code === "P2002") {
        // Removed deviceId and userId from logs for security
        //console.log(`[DEBUG] Device fingerprint already exists, attempting update`);

        // Find the existing record
        const existingDevice = await db.deviceFingerprint.findFirst({
          where: {
            deviceId,
            userId: userId || null,
          },
          include: userId
            ? {
                user: {
                  select: {
                    id: true,
                    email: true,
                    username: true,
                    createdAt: true,
                    fraudScore: true,
                    accountReputation: true,
                  },
                },
              }
            : {},
        });

        if (existingDevice) {
          //console.log(`[DEBUG] Updating existing device fingerprint:`, existingDevice.id);
          deviceRecord = await db.deviceFingerprint.update({
            where: { id: existingDevice.id },
            data: {
              lastSeen: new Date(),
              ip: clientIP,
              userAgent: userAgent || req.headers.get("user-agent"),
              browser: browser || existingDevice.browser,
              os: os || existingDevice.os,
              screenRes: screenRes || existingDevice.screenRes,
              timezone: timezone || existingDevice.timezone,
              language: language || existingDevice.language,
              location: locationData,
              isProxy: isProxy,
            },
            include: userId
              ? {
                  user: {
                    select: {
                      id: true,
                      email: true,
                      username: true,
                      createdAt: true,
                      fraudScore: true,
                      accountReputation: true,
                    },
                  },
                }
              : {},
          });

          // Removed deviceId and userId from logs for security
          {
            /*console.log(`[DEBUG] Device fingerprint updated successfully:`, {
            action: 'updated',
            id: deviceRecord.id
          });*/
          }
        } else {
          throw createError; // Re-throw if we can't find the existing device
        }
      } else {
        // If it's not a constraint violation, re-throw the error
        throw createError;
      }
    }

    // Check for device sharing fraud (only for logged-in users) - OUTSIDE TRANSACTION
    if (userId) {
      try {
        const otherUsersOnDevice = await db.deviceFingerprint.findMany({
          where: {
            deviceId,
            AND: [
              { userId: { not: userId } }, // Exclude current user
              { userId: { not: null } }, // Exclude guest users (null)
            ],
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
              },
            },
          },
        });

        if (otherUsersOnDevice.length > 0) {
          // Check if we already have a recent DEVICE_SHARING event for this user-device combination
          const existingFraudEvent = await db.fraudDetectionEvent.findFirst({
            where: {
              userId,
              eventType: "DEVICE_SHARING",
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
              },
            },
          });

          // Only create fraud event if one doesn't already exist
          if (!existingFraudEvent) {
            await db.fraudDetectionEvent.create({
              data: {
                userId,
                eventType: "DEVICE_SHARING",
                severity: "MEDIUM",
                riskScore: 0.5,
                description: `Device ${deviceId} used by multiple accounts`,
                evidence: {
                  existingUsers: otherUsersOnDevice.map((d) => ({
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
                userAgent: userAgent || req.headers.get("user-agent"),
                location: locationData,
                status: "OPEN",
                actionsTaken: [],
              },
            });
          }
        }
      } catch (fraudError) {
        console.warn("Error checking for device sharing fraud:", fraudError);
        // Continue even if fraud detection fails
      }
    }

    return NextResponse.json({
      success: true,
      device: deviceRecord,
      isExisting: deviceRecord.userId !== null,
      message: deviceRecord.userId
        ? "Device fingerprint updated"
        : "New device fingerprint created",
      ipAnalysis: {
        isProxy,
        suspiciousReasons,
        location: locationData,
      },
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error processing device fingerprint:", error);

    // Don't log JSON parse errors or validation errors - they're expected client-side issues

    // Log to database - user could email about "device fingerprint not working"
    const userMessage = logError({
      code: "DEVICE_FINGERPRINT_PROCESS_FAILED",
      userId: session?.user?.id || body?.userId,
      route: "/api/device-fingerprint",
      method: "POST",
      error,
      metadata: {
        deviceId: body?.deviceId,
        note: "Failed to process device fingerprint",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let deviceId: string | null = null;

  try {
    session = await auth();
    const { searchParams } = new URL(req.url);
    deviceId = searchParams.get("deviceId");

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
          },
        },
      },
      orderBy: { lastSeen: "desc" },
    });

    // Get device analysis for IP and location info
    let deviceAnalysis = null;
    try {
      deviceAnalysis = await FraudDetectionService.getDeviceAnalysis(deviceId);
    } catch (error) {
      console.warn("Could not get device analysis:", error);
    }

    // Calculate risk factors
    const riskFactors = {
      multipleAccounts: deviceUsers.length > 1,
      suspiciousUsers: deviceUsers.filter(
        (u) => u.user && (u.user.fraudScore || 0) > 0.7
      ).length,
      chargebackUsers: deviceUsers.filter(
        (u) => u.user && (u.user.numChargebacks || 0) > 0
      ).length,
      recentActivity: deviceUsers.some(
        (u) => new Date(u.lastSeen).getTime() > Date.now() - 24 * 60 * 60 * 1000
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
      firstSeen:
        deviceUsers.length > 0
          ? deviceUsers[deviceUsers.length - 1].firstSeen
          : null,
      lastSeen: deviceUsers.length > 0 ? deviceUsers[0].lastSeen : null,
      associatedAccounts: deviceUsers.length,
      riskScore: Math.min(riskScore, 1.0),
      isProxy: deviceUsers.length > 0 ? deviceUsers[0].isProxy || false : false,
      location: deviceUsers.length > 0 ? deviceUsers[0].location || null : null,
      riskFactors,
      deviceUsers: deviceUsers.map((du) => ({
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
      analysis,
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error getting device analysis:", error);

    // Don't log validation errors - they're expected client-side issues

    // Log to database - user could email about "can't get device analysis"
    const userMessage = logError({
      code: "DEVICE_FINGERPRINT_ANALYSIS_FAILED",
      userId: session?.user?.id,
      route: "/api/device-fingerprint",
      method: "GET",
      error,
      metadata: {
        deviceId,
        note: "Failed to get device analysis",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

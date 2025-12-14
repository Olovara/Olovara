import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getUserLocationPreferences } from "@/lib/ipinfo";
import { logError } from "@/lib/error-logger";

// Helper function to get country code with three-tier fallback
async function getCountryCodeForStripe(
  userId: string,
  request: NextRequest
): Promise<string> {
  try {
    // Tier 1: Get country from seller preferences (if they've already set it)
    const seller = await db.seller.findUnique({
      where: { userId },
      select: { shopCountry: true },
    });

    if (seller?.shopCountry && seller.shopCountry !== "US") {
      console.log(
        `Using seller's shop country preference: ${seller.shopCountry}`
      );
      return seller.shopCountry;
    }

    // Tier 2: Use location detector to get current country
    try {
      const forwarded = request.headers.get("x-forwarded-for");
      const realIP = request.headers.get("x-real-ip");
      const clientIP = forwarded?.split(",")[0] || realIP || request.ip || "";

      if (clientIP) {
        const locationPreferences = await getUserLocationPreferences(clientIP);
        if (
          locationPreferences.countryCode &&
          locationPreferences.countryCode !== "US"
        ) {
          console.log(
            `Using detected location: ${locationPreferences.countryCode}`
          );
          return locationPreferences.countryCode;
        }
      }
    } catch (locationError) {
      console.warn(
        "Location detection failed, falling back to US:",
        locationError
      );
    }

    // Tier 3: Default to US
    console.log("Using default country: US");
    return "US";
  } catch (error) {
    console.error("Error determining country code:", error);
    return "US"; // Safe fallback
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const logContext: any = {
    endpoint: "/api/stripe/connect",
    timestamp: new Date().toISOString(),
    action: "create_stripe_connect_link",
  };

  // Declare session outside try block so it's accessible in catch block
  let session: any = null;

  try {
    // Infrastructure checks - validate environment and configuration
    const envChecks = {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? "EXISTS" : "MISSING",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
        ? "EXISTS"
        : "MISSING",
      NODE_ENV: process.env.NODE_ENV || "MISSING",
      stripeKeyType: process.env.STRIPE_SECRET_KEY?.startsWith("sk_live")
        ? "LIVE"
        : process.env.STRIPE_SECRET_KEY?.startsWith("sk_test")
          ? "TEST"
          : "UNKNOWN",
    };

    logContext.envChecks = envChecks;

    // Validate critical environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      const errorDetails = {
        ...logContext,
        error: "STRIPE_SECRET_KEY environment variable is missing",
        status: "CONFIG_ERROR",
        note: "Server configuration issue - Stripe secret key not found",
      };
      console.error(
        `[STRIPE_CONNECT] Configuration error - missing Stripe key`,
        errorDetails
      );
      return NextResponse.json(
        { error: "Server configuration error. Please contact support." },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.warn(
        `[STRIPE_CONNECT] NEXT_PUBLIC_APP_URL not set - return URLs may be incorrect`,
        logContext
      );
    }

    // Note: Database connection will be tested when we query for seller
    // We'll log any database errors when they occur
    logContext.dbConnection = "Will be tested during seller lookup";

    // Check if this is a Stripe webhook/service request (should not be calling this endpoint)
    const userAgent = request.headers.get("user-agent") || "";
    const isStripeRequest =
      userAgent.includes("Stripe/") || userAgent.includes("stripe.com");

    if (isStripeRequest) {
      const errorDetails = {
        ...logContext,
        userAgent,
        error: "Stripe service attempted to access user-only endpoint",
        status: "CONFIG_ERROR",
        note: "Stripe webhooks/services should use /api/stripe/webhooks, not /api/stripe/connect. Check Stripe webhook configuration in dashboard.",
      };
      console.error(
        `[STRIPE_CONNECT] Rejected Stripe service request`,
        errorDetails
      );
      return NextResponse.json(
        {
          error:
            "This endpoint is for authenticated users only. Stripe webhooks should use /api/stripe/webhooks",
        },
        { status: 403 }
      );
    }

    // Log request details for debugging authentication issues
    const cookies = request.headers.get("cookie");
    const hasAuthCookie =
      cookies?.includes("authjs") ||
      cookies?.includes("__Secure-authjs") ||
      cookies?.includes("next-auth");

    logContext.hasCookies = !!cookies;
    logContext.hasAuthCookie = hasAuthCookie;
    logContext.cookieCount = cookies?.split(";").length || 0;
    logContext.userAgent = userAgent;

    session = await auth();

    if (!session?.user?.id) {
      const authErrorDetails = {
        ...logContext,
        hasSession: !!session,
        sessionUserId: session?.user?.id || null,
        sessionUserEmail: session?.user?.email || null,
        referer: request.headers.get("referer"),
        origin: request.headers.get("origin"),
        note: "Session authentication failed - check if cookies are being sent and session is valid. This may indicate: expired session, missing cookies, or CORS issue.",
      };
      console.error(`[STRIPE_CONNECT] Authentication failed`, authErrorDetails);
      return NextResponse.json(
        {
          error: "Not authenticated. Please refresh the page and try again.",
          requiresAuth: true,
        },
        { status: 401 }
      );
    }

    logContext.userId = session.user.id;
    // Don't log user email for privacy

    console.log(`[STRIPE_CONNECT] Starting Stripe Connect process`, logContext);

    // Get the seller profile
    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: { id: true, userId: true, connectedAccountId: true },
    });

    if (!seller) {
      console.error(`[STRIPE_CONNECT] Seller profile not found`, logContext);
      return NextResponse.json(
        { error: "Seller profile not found" },
        { status: 404 }
      );
    }

    logContext.sellerId = seller.id;
    logContext.existingAccountId = seller.connectedAccountId;

    // Check if already connected with a real Stripe account
    if (
      seller.connectedAccountId &&
      !seller.connectedAccountId.startsWith("temp_")
    ) {
      console.log(`[STRIPE_CONNECT] Account already connected`, {
        ...logContext,
        connectedAccountId: seller.connectedAccountId,
      });
      return NextResponse.json(
        {
          error: "Stripe account already connected",
          connectedAccountId: seller.connectedAccountId,
        },
        { status: 400 }
      );
    }

    // Initialize Stripe with validation
    let stripe;
    try {
      stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
      logContext.stripeInitialized = true;
      // Key type already logged in envChecks above
    } catch (stripeInitError) {
      const errorDetails = {
        ...logContext,
        error:
          stripeInitError instanceof Error
            ? stripeInitError.message
            : String(stripeInitError),
        stack:
          stripeInitError instanceof Error ? stripeInitError.stack : undefined,
        status: "STRIPE_INIT_ERROR",
        note: "Failed to initialize Stripe SDK - check if STRIPE_SECRET_KEY is valid",
      };
      console.error(
        `[STRIPE_CONNECT] Stripe initialization failed`,
        errorDetails
      );
      return NextResponse.json(
        {
          error: "Payment service configuration error. Please contact support.",
        },
        { status: 500 }
      );
    }

    let connectedAccountId = seller.connectedAccountId;

    // If the seller has a temporary connectedAccountId, create a real Stripe account
    if (!connectedAccountId || connectedAccountId.startsWith("temp_")) {
      if (!session.user.email) {
        console.error(`[STRIPE_CONNECT] User email not available`, logContext);
        return NextResponse.json(
          { error: "User email is not available" },
          { status: 400 }
        );
      }

      // Get country code using three-tier fallback
      console.log(`[STRIPE_CONNECT] Determining country code`, logContext);
      const countryCode = await getCountryCodeForStripe(
        session.user.id,
        request
      );
      logContext.countryCode = countryCode;

      console.log(`[STRIPE_CONNECT] Creating Stripe Connect account`, {
        ...logContext,
        countryCode,
      });

      // Create a new Stripe Connect account with retry logic
      let account;
      let retries = 3;
      let lastError;

      while (retries > 0) {
        try {
          const accountStartTime = Date.now();
          account = await stripe.accounts.create({
            type: "express",
            country: countryCode,
            email: session.user.email,
            capabilities: {
              transfers: { requested: true },
              card_payments: { requested: true },
            },
          });

          const accountDuration = Date.now() - accountStartTime;
          logContext.stripeAccountCreationMs = accountDuration;
          logContext.stripeAccountId = account.id;
          console.log(`[STRIPE_CONNECT] Stripe account created successfully`, {
            ...logContext,
            accountId: account.id,
            durationMs: accountDuration,
          });
          break; // Success
        } catch (stripeError: any) {
          lastError = stripeError;
          retries--;

          const stripeErrorDetails = {
            ...logContext,
            attemptsLeft: retries,
            error: stripeError.message,
            errorType: stripeError.type,
            errorCode: stripeError.code,
            statusCode: stripeError.statusCode,
            requestId: stripeError.requestId,
            stack: stripeError.stack,
            note: retries > 0 ? "Retrying..." : "All retries exhausted",
          };

          if (retries > 0) {
            console.warn(
              `[STRIPE_CONNECT] Stripe account creation failed, retrying...`,
              stripeErrorDetails
            );
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * (4 - retries))
            ); // Exponential backoff
          } else {
            console.error(
              `[STRIPE_CONNECT] Stripe account creation failed after all retries`,
              stripeErrorDetails
            );
          }
        }
      }

      if (!account) {
        const errorDetails = {
          ...logContext,
          error: lastError?.message || "Stripe API timeout",
          errorType: lastError?.type,
          errorCode: lastError?.code,
          statusCode: lastError?.statusCode,
          requestId: lastError?.requestId,
          stack: lastError?.stack,
          note: "Failed to create Stripe account after all retries. Check: Stripe API status, network connectivity, rate limits, or invalid API key.",
        };
        console.error(
          `[STRIPE_CONNECT] Failed to create Stripe account after retries`,
          errorDetails
        );
        return NextResponse.json(
          {
            error:
              "Failed to create Stripe account. Please try again or contact support if the issue persists.",
          },
          { status: 500 }
        );
      }

      logContext.stripeAccountId = account.id;
      console.log(`[STRIPE_CONNECT] Stripe account created successfully`, {
        ...logContext,
        accountId: account.id,
      });

      // Update the database with the real Stripe account ID
      const dbUpdateStartTime = Date.now();
      try {
        await db.seller.update({
          where: { userId: session.user.id },
          data: {
            connectedAccountId: account.id,
            stripeConnected: false, // Will be set to true after onboarding completion via webhook
          },
        });
        const dbUpdateDuration = Date.now() - dbUpdateStartTime;
        logContext.dbUpdateMs = dbUpdateDuration;
        console.log(
          `[STRIPE_CONNECT] Database updated with Stripe account ID`,
          {
            ...logContext,
            durationMs: dbUpdateDuration,
          }
        );
      } catch (dbError) {
        const dbUpdateDuration = Date.now() - dbUpdateStartTime;
        const errorDetails = {
          ...logContext,
          error: dbError instanceof Error ? dbError.message : String(dbError),
          errorType:
            dbError instanceof Error
              ? dbError.constructor.name
              : typeof dbError,
          stack: dbError instanceof Error ? dbError.stack : undefined,
          durationMs: dbUpdateDuration,
          note: "Database update failed - Stripe account was created but not saved. This may cause sync issues.",
        };
        console.error(
          `[STRIPE_CONNECT] Failed to update database`,
          errorDetails
        );
        // Continue anyway - we'll try to create the link, but this is a problem
      }

      connectedAccountId = account.id;
    }

    // Create the account link for onboarding with retry logic
    console.log(`[STRIPE_CONNECT] Creating account link`, {
      ...logContext,
      connectedAccountId,
    });

    let accountLink;
    let linkRetries = 3;
    let linkLastError;

    while (linkRetries > 0) {
      try {
        const linkStartTime = Date.now();
        accountLink = await stripe.accountLinks.create({
          account: connectedAccountId,
          refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/seller/dashboard/billing`,
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/stripe-return/${connectedAccountId}`,
          type: "account_onboarding",
        });

        const linkDuration = Date.now() - linkStartTime;
        logContext.accountLinkCreationMs = linkDuration;
        logContext.returnUrl = accountLink.url;
        console.log(`[STRIPE_CONNECT] Account link created successfully`, {
          ...logContext,
          durationMs: linkDuration,
        });
        break; // Success
      } catch (stripeError: any) {
        linkLastError = stripeError;
        linkRetries--;

        const linkErrorDetails = {
          ...logContext,
          attemptsLeft: linkRetries,
          error: stripeError.message,
          errorType: stripeError.type,
          errorCode: stripeError.code,
          statusCode: stripeError.statusCode,
          requestId: stripeError.requestId,
          stack: stripeError.stack,
          returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/stripe-return/${connectedAccountId}`,
          refreshUrl: `${process.env.NEXT_PUBLIC_APP_URL}/seller/dashboard/billing`,
          note: linkRetries > 0 ? "Retrying..." : "All retries exhausted",
        };

        if (linkRetries > 0) {
          console.warn(
            `[STRIPE_CONNECT] Account link creation failed, retrying...`,
            linkErrorDetails
          );
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (4 - linkRetries))
          ); // Exponential backoff
        } else {
          console.error(
            `[STRIPE_CONNECT] Account link creation failed after all retries`,
            linkErrorDetails
          );
        }
      }
    }

    if (!accountLink) {
      const errorDetails = {
        ...logContext,
        error: linkLastError?.message || "Stripe API timeout",
        errorType: linkLastError?.type,
        errorCode: linkLastError?.code,
        statusCode: linkLastError?.statusCode,
        requestId: linkLastError?.requestId,
        stack: linkLastError?.stack,
        note: "Failed to create account link after all retries. Check: Stripe API status, account validity, or URL configuration.",
      };
      console.error(
        `[STRIPE_CONNECT] Failed to create account link after retries`,
        errorDetails
      );
      return NextResponse.json(
        {
          error:
            "Failed to create Stripe account link. Please try again or contact support if the issue persists.",
        },
        { status: 500 }
      );
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[STRIPE_CONNECT] Account link created successfully`, {
      ...logContext,
      totalDurationMs: totalDuration,
      status: "SUCCESS",
    });

    return NextResponse.json({
      success: true,
      url: accountLink.url,
      connectedAccountId: connectedAccountId,
    });
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    const errorDetails = {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      totalDurationMs: totalDuration,
      status: "FAILED",
    };

    console.error(
      `[STRIPE_CONNECT] Error creating Stripe Connect account link`,
      errorDetails
    );

    // Log to error database
    const userMessage = logError({
      code: "STRIPE_CONNECT_FAILED",
      userId: session?.user?.id,
      route: "/api/stripe/connect",
      method: "POST",
      error,
      metadata: {
        ...logContext,
        totalDurationMs: totalDuration,
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

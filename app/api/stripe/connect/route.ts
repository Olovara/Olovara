import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getUserLocationPreferences } from "@/lib/ipinfo";

// Helper function to get country code with three-tier fallback
async function getCountryCodeForStripe(userId: string, request: NextRequest): Promise<string> {
  try {
    // Tier 1: Get country from seller preferences (if they've already set it)
    const seller = await db.seller.findUnique({
      where: { userId },
      select: { shopCountry: true }
    });

    if (seller?.shopCountry && seller.shopCountry !== "US") {
      console.log(`Using seller's shop country preference: ${seller.shopCountry}`);
      return seller.shopCountry;
    }

    // Tier 2: Use location detector to get current country
    try {
      const forwarded = request.headers.get('x-forwarded-for');
      const realIP = request.headers.get('x-real-ip');
      const clientIP = forwarded?.split(',')[0] || realIP || request.ip || '';

      if (clientIP) {
        const locationPreferences = await getUserLocationPreferences(clientIP);
        if (locationPreferences.countryCode && locationPreferences.countryCode !== "US") {
          console.log(`Using detected location: ${locationPreferences.countryCode}`);
          return locationPreferences.countryCode;
        }
      }
    } catch (locationError) {
      console.warn("Location detection failed, falling back to US:", locationError);
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
    endpoint: '/api/stripe/connect',
    timestamp: new Date().toISOString(),
    action: 'create_stripe_connect_link'
  };

  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      console.error(`[STRIPE_CONNECT] Authentication failed`, logContext);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    logContext.userId = session.user.id;
    // Don't log user email for privacy

    console.log(`[STRIPE_CONNECT] Starting Stripe Connect process`, logContext);

    // Get the seller profile
    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: { id: true, userId: true, connectedAccountId: true }
    });

    if (!seller) {
      console.error(`[STRIPE_CONNECT] Seller profile not found`, logContext);
      return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
    }

    logContext.sellerId = seller.id;
    logContext.existingAccountId = seller.connectedAccountId;

    // Check if already connected with a real Stripe account
    if (seller.connectedAccountId && !seller.connectedAccountId.startsWith('temp_')) {
      console.log(`[STRIPE_CONNECT] Account already connected`, { 
        ...logContext, 
        connectedAccountId: seller.connectedAccountId 
      });
      return NextResponse.json({ 
        error: "Stripe account already connected",
        connectedAccountId: seller.connectedAccountId 
      }, { status: 400 });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    let connectedAccountId = seller.connectedAccountId;

    // If the seller has a temporary connectedAccountId, create a real Stripe account
    if (!connectedAccountId || connectedAccountId.startsWith('temp_')) {
      if (!session.user.email) {
        console.error(`[STRIPE_CONNECT] User email not available`, logContext);
        return NextResponse.json({ error: "User email is not available" }, { status: 400 });
      }

      // Get country code using three-tier fallback
      console.log(`[STRIPE_CONNECT] Determining country code`, logContext);
      const countryCode = await getCountryCodeForStripe(session.user.id, request);
      logContext.countryCode = countryCode;

      console.log(`[STRIPE_CONNECT] Creating Stripe Connect account`, { 
        ...logContext, 
        countryCode 
      });
      
      // Create a new Stripe Connect account with retry logic
      let account;
      let retries = 3;
      let lastError;
      
      while (retries > 0) {
        try {
          account = await stripe.accounts.create({
            type: "express",
            country: countryCode,
            email: session.user.email,
            capabilities: {
              transfers: { requested: true },
              card_payments: { requested: true },
            },
          });
          break; // Success
        } catch (stripeError: any) {
          lastError = stripeError;
          retries--;
          if (retries > 0) {
            console.warn(`[STRIPE_CONNECT] Stripe account creation failed, retrying...`, { 
              ...logContext, 
              attemptsLeft: retries,
              error: stripeError.message 
            });
            await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries))); // Exponential backoff
          }
        }
      }

      if (!account) {
        const errorDetails = {
          ...logContext,
          error: lastError?.message || "Stripe API timeout",
          errorType: lastError?.type,
          stack: lastError?.stack
        };
        console.error(`[STRIPE_CONNECT] Failed to create Stripe account after retries`, errorDetails);
        return NextResponse.json(
          { error: "Failed to create Stripe account. Please try again." },
          { status: 500 }
        );
      }

      logContext.stripeAccountId = account.id;
      console.log(`[STRIPE_CONNECT] Stripe account created successfully`, { 
        ...logContext, 
        accountId: account.id 
      });

      // Update the database with the real Stripe account ID
      try {
        await db.seller.update({
          where: { userId: session.user.id },
          data: { 
            connectedAccountId: account.id,
            stripeConnected: false // Will be set to true after onboarding completion via webhook
          }
        });
        console.log(`[STRIPE_CONNECT] Database updated with Stripe account ID`, logContext);
      } catch (dbError) {
        const errorDetails = {
          ...logContext,
          error: dbError instanceof Error ? dbError.message : String(dbError),
          stack: dbError instanceof Error ? dbError.stack : undefined
        };
        console.error(`[STRIPE_CONNECT] Failed to update database`, errorDetails);
        // Continue anyway - we'll try to create the link
      }

      connectedAccountId = account.id;
    }

    // Create the account link for onboarding with retry logic
    console.log(`[STRIPE_CONNECT] Creating account link`, { ...logContext, connectedAccountId });
    
    let accountLink;
    let linkRetries = 3;
    let linkLastError;
    
    while (linkRetries > 0) {
      try {
        accountLink = await stripe.accountLinks.create({
          account: connectedAccountId,
          refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/seller/dashboard/billing`,
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/stripe-return/${connectedAccountId}`,
          type: 'account_onboarding',
        });
        break; // Success
      } catch (stripeError: any) {
        linkLastError = stripeError;
        linkRetries--;
        if (linkRetries > 0) {
          console.warn(`[STRIPE_CONNECT] Account link creation failed, retrying...`, { 
            ...logContext, 
            attemptsLeft: linkRetries,
            error: stripeError.message 
          });
          await new Promise(resolve => setTimeout(resolve, 1000 * (4 - linkRetries))); // Exponential backoff
        }
      }
    }

    if (!accountLink) {
      const errorDetails = {
        ...logContext,
        error: linkLastError?.message || "Stripe API timeout",
        errorType: linkLastError?.type,
        stack: linkLastError?.stack
      };
      console.error(`[STRIPE_CONNECT] Failed to create account link after retries`, errorDetails);
      return NextResponse.json(
        { error: "Failed to create Stripe account link. Please try again." },
        { status: 500 }
      );
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[STRIPE_CONNECT] Account link created successfully`, { 
      ...logContext, 
      totalDurationMs: totalDuration,
      status: 'SUCCESS'
    });

    return NextResponse.json({
      success: true,
      url: accountLink.url,
      connectedAccountId: connectedAccountId
    });

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    const errorDetails = {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      totalDurationMs: totalDuration,
      status: 'FAILED'
    };
    
    console.error(`[STRIPE_CONNECT] Error creating Stripe Connect account link`, errorDetails);
    return NextResponse.json(
      { error: "Failed to create Stripe Connect account link" },
      { status: 500 }
    );
  }
}
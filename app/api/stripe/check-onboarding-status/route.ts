import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { updateOnboardingStep } from "@/lib/onboarding";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const logContext: any = {
    endpoint: '/api/stripe/check-onboarding-status',
    timestamp: new Date().toISOString(),
    action: 'check_stripe_onboarding_status'
  };

  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      console.error(`[STRIPE_CHECK] Authentication failed`, logContext);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    logContext.userId = session.user.id;

    const { connectedAccountId } = await request.json();

    if (!connectedAccountId) {
      console.error(`[STRIPE_CHECK] Missing connectedAccountId`, logContext);
      return NextResponse.json({ error: "Connected account ID is required" }, { status: 400 });
    }

    logContext.connectedAccountId = connectedAccountId;

    console.log(`[STRIPE_CHECK] Starting onboarding status check`, logContext);

    // Verify the seller owns this connected account
    const seller = await db.seller.findUnique({
      where: { 
        userId: session.user.id,
        connectedAccountId: connectedAccountId
      },
      select: { id: true, stripeConnected: true }
    });

    if (!seller) {
      console.error(`[STRIPE_CHECK] Seller not found or account mismatch`, logContext);
      return NextResponse.json({ error: "Seller not found or account mismatch" }, { status: 404 });
    }

    logContext.sellerId = seller.id;
    logContext.currentStripeConnected = seller.stripeConnected;

    // If already connected, no need to check
    if (seller.stripeConnected) {
      console.log(`[STRIPE_CHECK] Already connected, skipping check`, logContext);
      return NextResponse.json({ success: true, alreadyConnected: true });
    }

    // Skip verification for temp accounts - they should be replaced with real accounts during onboarding
    if (connectedAccountId.startsWith('temp_')) {
      console.log(`[STRIPE_CHECK] Temporary account detected`, logContext);
      return NextResponse.json({ 
        success: true, 
        connected: false,
        message: "Temporary account - needs to be replaced with real Stripe account"
      });
    }

    // Validate Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY) {
      const errorDetails = {
        ...logContext,
        error: 'STRIPE_SECRET_KEY environment variable is missing',
        status: 'CONFIG_ERROR',
        note: 'Server configuration issue - Stripe secret key not found'
      };
      console.error(`[STRIPE_CHECK] Configuration error - missing Stripe key`, errorDetails);
      return NextResponse.json(
        { error: "Server configuration error. Please contact support." },
        { status: 500 }
      );
    }
    
    // Log environment checks (without exposing sensitive values)
    logContext.envChecks = {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'EXISTS' : 'MISSING',
      stripeKeyType: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? 'LIVE' : 
                     process.env.STRIPE_SECRET_KEY?.startsWith('sk_test') ? 'TEST' : 'UNKNOWN'
    };
    
    // Check the Stripe account status with retry logic
    let stripe;
    try {
      stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      logContext.stripeInitialized = true;
    } catch (stripeInitError) {
      const errorDetails = {
        ...logContext,
        error: stripeInitError instanceof Error ? stripeInitError.message : String(stripeInitError),
        status: 'STRIPE_INIT_ERROR',
        note: 'Failed to initialize Stripe SDK'
      };
      console.error(`[STRIPE_CHECK] Stripe initialization failed`, errorDetails);
      return NextResponse.json(
        { error: "Payment service configuration error. Please contact support." },
        { status: 500 }
      );
    }
    
    let account;
    let retries = 3;
    let lastError;
    
    console.log(`[STRIPE_CHECK] Retrieving Stripe account status`, logContext);
    
    // Retry logic in case Stripe API is slow or times out
    while (retries > 0) {
      try {
        account = await stripe.accounts.retrieve(connectedAccountId);
        console.log(`[STRIPE_CHECK] Stripe account retrieved successfully`, { 
          ...logContext, 
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled
        });
        break; // Success, exit retry loop
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
          note: retries > 0 ? 'Retrying...' : 'All retries exhausted'
        };
        
        if (retries > 0) {
          console.warn(`[STRIPE_CHECK] Stripe API call failed, retrying...`, stripeErrorDetails);
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
        } else {
          console.error(`[STRIPE_CHECK] Stripe API call failed after all retries`, stripeErrorDetails);
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
        note: 'Failed to retrieve Stripe account after all retries. Check: Stripe API status, network connectivity, rate limits, invalid account ID, or API key issues.'
      };
      console.error(`[STRIPE_CHECK] Failed to retrieve Stripe account after retries`, errorDetails);
      return NextResponse.json({ 
        error: "Failed to check Stripe account status",
        message: lastError?.message || "Stripe API timeout"
      }, { status: 500 });
    }
    
    // Check if the account is fully onboarded (can accept charges and payouts)
    if (account.charges_enabled && account.payouts_enabled) {
      console.log(`[STRIPE_CHECK] Account fully onboarded, updating database`, logContext);
      
      // Update in a transaction to ensure consistency
      try {
        await db.$transaction(async (tx) => {
          // Update the seller's stripeConnected status
          await tx.seller.update({
            where: { id: seller.id },
            data: { stripeConnected: true }
          });

          // Mark payment_setup step as completed
          await tx.onboardingStep.upsert({
            where: {
              sellerId_stepKey: {
                sellerId: seller.id,
                stepKey: "payment_setup",
              },
            },
            update: {
              completed: true,
              completedAt: new Date(),
            },
            create: {
              sellerId: seller.id,
              stepKey: "payment_setup",
              completed: true,
              completedAt: new Date(),
            },
          });
        });

        // Recalculate isFullyActivated (outside transaction)
        try {
          await updateOnboardingStep(seller.id, "payment_setup", true);
          console.log(`[STRIPE_CHECK] isFullyActivated recalculated`, logContext);
        } catch (recalcError) {
          console.warn(`[STRIPE_CHECK] Failed to recalculate isFullyActivated (non-critical)`, { 
            ...logContext, 
            error: recalcError instanceof Error ? recalcError.message : String(recalcError)
          });
        }

        const totalDuration = Date.now() - startTime;
        console.log(`[STRIPE_CHECK] Account fully onboarded and database updated`, { 
          ...logContext, 
          totalDurationMs: totalDuration,
          status: 'SUCCESS'
        });
        
        return NextResponse.json({ 
          success: true, 
          connected: true,
          message: "Stripe account fully onboarded"
        });
      } catch (dbError) {
        const errorDetails = {
          ...logContext,
          error: dbError instanceof Error ? dbError.message : String(dbError),
          stack: dbError instanceof Error ? dbError.stack : undefined
        };
        console.error(`[STRIPE_CHECK] Failed to update database`, errorDetails);
        return NextResponse.json({ 
          error: "Account is onboarded but failed to update database. Please refresh the page.",
          connected: true // Account is onboarded, just DB update failed
        }, { status: 500 });
      }
    } else {
      const totalDuration = Date.now() - startTime;
      console.log(`[STRIPE_CHECK] Account not fully onboarded yet`, { 
        ...logContext, 
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        totalDurationMs: totalDuration
      });
      
      return NextResponse.json({ 
        success: true, 
        connected: false,
        message: "Stripe account not fully onboarded yet"
      });
    }

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
    
    console.error(`[STRIPE_CHECK] Error in check onboarding status`, errorDetails);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
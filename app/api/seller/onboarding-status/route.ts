import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getSellerOnboardingSteps, getOnboardingProgress, getNextOnboardingStep, updateOnboardingStep } from "@/lib/onboarding";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get seller data
    const seller = await db.seller.findUnique({
      where: { userId },
      select: {
        id: true,
        applicationAccepted: true,
        stripeConnected: true,
        connectedAccountId: true,
        shopCountry: true,
        isFullyActivated: true,
        shippingOptions: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Get onboarding steps
    const onboardingSteps = await getSellerOnboardingSteps(seller.id);
    const completionPercentage = await getOnboardingProgress(seller.id);
    const nextStep = await getNextOnboardingStep(seller.id);

    // Check Stripe connection status - if we have a connectedAccountId but stripeConnected is false,
    // check if the account is actually fully onboarded
    let stripeConnected = seller.stripeConnected && !!seller.connectedAccountId;
    
    // Skip verification for temp accounts - they should be replaced with real accounts during onboarding
    if (seller.connectedAccountId && !seller.stripeConnected && !seller.connectedAccountId.startsWith('temp_')) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const account = await stripe.accounts.retrieve(seller.connectedAccountId);
        
        if (account.charges_enabled && account.payouts_enabled) {
          // Update the database to reflect the actual status
          await db.seller.update({
            where: { id: seller.id },
            data: { stripeConnected: true }
          });
          
          // Mark payment_setup step as completed (this was missing!)
          await updateOnboardingStep(seller.id, "payment_setup", true);
          
          stripeConnected = true;
          console.log(`✅ Updated Stripe connection status for seller ${seller.id} via onboarding-status check`);
        }
      } catch (error) {
        console.warn("Could not verify Stripe account status:", error);
        // Keep stripeConnected as false if we can't verify
      }
    }

    return NextResponse.json({
      isFullyActivated: seller.isFullyActivated,
      stripeConnected,
      onboardingSteps,
      completionPercentage,
      nextStep,
      currentStep: nextStep || 'fully_activated',
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    console.error("Error fetching seller onboarding status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
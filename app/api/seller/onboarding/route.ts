import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch seller onboarding data from database
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        seller: {
          select: {
            id: true,
            applicationAccepted: true,
            stripeConnected: true,
            connectedAccountId: true,
            shopProfileComplete: true,
            shippingProfileCreated: true,
            isFullyActivated: true,
            shippingProfiles: {
              select: { id: true },
              take: 1,
            },
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If user doesn't have a seller profile, return null
    if (!user.seller) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "No seller profile found"
      });
    }

    // Check Stripe connection status - if we have a connectedAccountId but stripeConnected is false,
    // check if the account is actually fully onboarded
    let stripeConnected = user.seller.stripeConnected && !!user.seller.connectedAccountId;
    
    if (user.seller.connectedAccountId && !user.seller.stripeConnected) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const account = await stripe.accounts.retrieve(user.seller.connectedAccountId);
        
        if (account.charges_enabled && account.payouts_enabled) {
          // Update the database to reflect the actual status
          await db.seller.update({
            where: { id: user.seller.id },
            data: { stripeConnected: true }
          });
          stripeConnected = true;
        }
      } catch (error) {
        console.warn("Could not verify Stripe account status:", error);
        // Keep stripeConnected as false if we can't verify
      }
    }

    // Use the database field, but also check if there are actually shipping profiles
    // This ensures consistency between the flag and actual data
    const shippingProfileCreated = user.seller.shippingProfileCreated && user.seller.shippingProfiles.length > 0;

    // Calculate completion percentage
    let completionPercentage = 0;
    if (user.seller.applicationAccepted) completionPercentage += 20;
    if (user.seller.shopProfileComplete) completionPercentage += 20;
    if (stripeConnected) completionPercentage += 20;
    if (shippingProfileCreated) completionPercentage += 20;
    if (user.seller.isFullyActivated) completionPercentage += 20;

    // Determine current step
    let currentStep = 'application_submitted';
    if (!user.seller.applicationAccepted) {
      currentStep = 'application_approved';
    } else if (!user.seller.shopProfileComplete) {
      currentStep = 'profile_completed';
    } else if (!stripeConnected) {
      currentStep = 'stripe_connected';
    } else if (!shippingProfileCreated) {
      currentStep = 'shipping_profile_created';
    } else {
      currentStep = 'fully_activated';
    }

    const onboardingData = {
      applicationAccepted: user.seller.applicationAccepted,
      stripeConnected: stripeConnected,
      shopProfileComplete: user.seller.shopProfileComplete,
      shippingProfileCreated: shippingProfileCreated,
      isFullyActivated: user.seller.isFullyActivated,
      currentStep,
      completionPercentage,
    };

    return NextResponse.json({
      success: true,
      data: onboardingData,
      userId: session.user.id,
      fetchedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error fetching seller onboarding data:", error);
    return NextResponse.json(
      { error: "Failed to fetch seller onboarding data" }, 
      { status: 500 }
    );
  }
} 
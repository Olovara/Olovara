import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

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
        shippingProfileCreated: true,
        shippingProfiles: {
          select: { id: true },
          take: 1,
        },
      },
    });

    // Get seller application
    const application = await db.sellerApplication.findUnique({
      where: { userId },
      select: {
        applicationApproved: true,
      },
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Determine completion status
    const applicationApproved = application?.applicationApproved || false;
    const profileCompleted = !!(seller.shopCountry && seller.shopCountry.trim() !== "");
    
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
          stripeConnected = true;
        }
      } catch (error) {
        console.warn("Could not verify Stripe account status:", error);
        // Keep stripeConnected as false if we can't verify
      }
    }
    
    // Use the database field, but also check if there are actually shipping profiles
    // This ensures consistency between the flag and actual data
    const shippingProfileCreated = seller.shippingProfileCreated && seller.shippingProfiles.length > 0;

    // Calculate completion percentage
    let completionPercentage = 0;
    if (applicationApproved) completionPercentage += 20;
    if (profileCompleted) completionPercentage += 20;
    if (stripeConnected) completionPercentage += 20;
    if (shippingProfileCreated) completionPercentage += 20;
    if (shippingProfileCreated) completionPercentage += 20; // Fully activated

    // Determine current step
    let currentStep = 'application_submitted';
    if (!applicationApproved) {
      currentStep = 'application_approved';
    } else if (!profileCompleted) {
      currentStep = 'profile_completed';
    } else if (!stripeConnected) {
      currentStep = 'stripe_connected';
    } else if (!shippingProfileCreated) {
      currentStep = 'shipping_profile_created';
    } else {
      currentStep = 'fully_activated';
    }

    return NextResponse.json({
      applicationApproved,
      profileCompleted,
      stripeConnected,
      shippingProfileCreated,
      currentStep,
      completionPercentage,
    });

  } catch (error) {
    console.error("Error fetching seller onboarding status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
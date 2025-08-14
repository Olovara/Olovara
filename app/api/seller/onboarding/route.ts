import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch user and seller data from database
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
            shopName: true,
            shopNameSlug: true,
            shopCountry: true,
            preferredCurrency: true,
            totalProducts: true,
            firstProductCreatedAt: true,
            shippingProfiles: {
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If user doesn't have a seller profile, return null
    if (!user.seller) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "No seller profile found",
      });
    }

    // Check Stripe connection status
    let stripeConnected =
      user.seller.stripeConnected && !!user.seller.connectedAccountId;

    // Skip verification for temp accounts
    if (
      user.seller.connectedAccountId &&
      !user.seller.stripeConnected &&
      !user.seller.connectedAccountId.startsWith("temp_")
    ) {
      try {
        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
        const account = await stripe.accounts.retrieve(
          user.seller.connectedAccountId
        );

        if (account.charges_enabled && account.payouts_enabled) {
          await db.seller.update({
            where: { id: user.seller.id },
            data: { stripeConnected: true },
          });
          stripeConnected = true;
        }
      } catch (error) {
        console.warn("Could not verify Stripe account status:", error);
      }
    }

    // Check shipping profile creation
    const shippingProfileCreated =
      user.seller.shippingProfileCreated &&
      user.seller.shippingProfiles.length > 0;

    // Determine completion status for each step
    const shopPreferencesCompleted = !!(
      user.seller.shopCountry && user.seller.preferredCurrency
    );
    const shopNameCompleted = !!(
      user.seller.shopName && user.seller.shopNameSlug
    );
    const paymentSetupCompleted = stripeConnected;

    // Calculate completion percentage based on new flow (5 steps now)
    let completionPercentage = 0;
    if (shopPreferencesCompleted) completionPercentage += 25;
    if (shopNameCompleted) completionPercentage += 25;
    if (paymentSetupCompleted) completionPercentage += 25;
    if (user.seller.isFullyActivated) completionPercentage += 25;

    // Determine current step
    let currentStep = "shop_preferences";
    if (!shopPreferencesCompleted) {
      currentStep = "shop_preferences";
    } else if (!shopNameCompleted) {
      currentStep = "shop_naming";
    } else if (!paymentSetupCompleted) {
      currentStep = "payment_setup";
    } else {
      currentStep = "dashboard";
    }

    const onboardingData = {
      // New onboarding flow status
      shopPreferencesCompleted,
      shopNameCompleted,
      paymentSetupCompleted,

      // Legacy fields for backward compatibility
      applicationAccepted: user.seller.applicationAccepted,
      stripeConnected: stripeConnected,
      shopProfileComplete: user.seller.shopProfileComplete,
      shippingProfileCreated: shippingProfileCreated,
      isFullyActivated: user.seller.isFullyActivated,

      // Current step and completion
      currentStep,
      completionPercentage,
    };

    return NextResponse.json({
      success: true,
      data: onboardingData,
      userId: session.user.id,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching seller onboarding data:", error);
    return NextResponse.json(
      { error: "Failed to fetch seller onboarding data" },
      { status: 500 }
    );
  }
}

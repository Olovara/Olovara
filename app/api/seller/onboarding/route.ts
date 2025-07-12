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
            applicationAccepted: true,
            stripeConnected: true,
            shopProfileComplete: true,
            shippingProfileCreated: true,
            isFullyActivated: true,
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

    // Calculate completion percentage
    let completionPercentage = 0;
    if (user.seller.applicationAccepted) completionPercentage += 20;
    if (user.seller.shopProfileComplete) completionPercentage += 20;
    if (user.seller.stripeConnected) completionPercentage += 20;
    if (user.seller.shippingProfileCreated) completionPercentage += 20;
    if (user.seller.isFullyActivated) completionPercentage += 20;

    // Determine current step
    let currentStep = 'application_submitted';
    if (!user.seller.applicationAccepted) {
      currentStep = 'application_approved';
    } else if (!user.seller.shopProfileComplete) {
      currentStep = 'profile_completed';
    } else if (!user.seller.stripeConnected) {
      currentStep = 'stripe_connected';
    } else if (!user.seller.shippingProfileCreated) {
      currentStep = 'shipping_profile_created';
    } else {
      currentStep = 'fully_activated';
    }

    const onboardingData = {
      applicationAccepted: user.seller.applicationAccepted,
      stripeConnected: user.seller.stripeConnected,
      shopProfileComplete: user.seller.shopProfileComplete,
      shippingProfileCreated: user.seller.shippingProfileCreated,
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
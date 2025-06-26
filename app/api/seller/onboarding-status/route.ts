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
        applicationAccepted: true,
        stripeConnected: true,
        connectedAccountId: true,
        encryptedBusinessName: true,
        encryptedTaxId: true,
        taxIdVerified: true,
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
    const profileCompleted = !!(seller.encryptedBusinessName && seller.encryptedTaxId && seller.taxIdVerified);
    const stripeConnected = seller.stripeConnected && !!seller.connectedAccountId;
    const shippingProfileCreated = seller.shippingProfiles.length > 0;

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
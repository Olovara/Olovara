import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getSellerOnboardingSteps,
  getOnboardingProgress,
  getNextOnboardingStep,
  updateOnboardingStep,
  initializeOnboardingSteps,
  checkIsFullyActivated,
  recalculateOnboardingSteps,
  OnboardingStepKey
} from "@/lib/onboarding";

/**
 * GET /api/seller/onboarding
 * Get current onboarding status for the authenticated seller
 */
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the seller record
    const seller = await prisma.seller.findUnique({
      where: { userId: session.user.id },
      select: { id: true, isFullyActivated: true }
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Initialize onboarding steps if they don't exist
    await initializeOnboardingSteps(seller.id);

    // Recalculate onboarding steps to ensure GPSR compliance is handled correctly
    await recalculateOnboardingSteps(seller.id);

    // Get onboarding data
    const [steps, progress, nextStep, isFullyActivated] = await Promise.all([
      getSellerOnboardingSteps(seller.id),
      getOnboardingProgress(seller.id),
      getNextOnboardingStep(seller.id),
      checkIsFullyActivated(seller.id)
    ]);

    // Return data in the format expected by useSellerOnboardingAPI
    // Add cache headers to prevent stale data
    return NextResponse.json({
      success: true,
      data: {
        steps,
        progress,
        nextStep,
        isFullyActivated,
        // Legacy compatibility fields
        applicationAccepted: steps.some(step => step.stepKey === 'application_approved' && step.completed),
        stripeConnected: steps.some(step => step.stepKey === 'payment_setup' && step.completed),
        shopProfileComplete: steps.some(step => step.stepKey === 'shop_naming' && step.completed),
        shippingProfileCreated: false, // This will be handled separately
        currentStep: nextStep || 'application_submitted',
        completionPercentage: progress,
        // New onboarding flow status
        shopPreferencesCompleted: steps.some(step => step.stepKey === 'shop_preferences' && step.completed),
        shopNameCompleted: steps.some(step => step.stepKey === 'shop_naming' && step.completed),
        paymentSetupCompleted: steps.some(step => step.stepKey === 'payment_setup' && step.completed),
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    console.error("Error fetching onboarding data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/seller/onboarding
 * Update an onboarding step for the authenticated seller
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { stepKey, completed } = body;

    // Validate input
    if (!stepKey || typeof completed !== "boolean") {
      return NextResponse.json(
        { error: "Invalid input: stepKey and completed are required" },
        { status: 400 }
      );
    }

    // Validate stepKey - updated to match existing dashboard flow
    const validStepKeys = [
      "application_submitted",
      "application_approved",
      "shop_preferences",
      "shop_naming",
      "payment_setup",
      "gpsr_compliance"
    ];

    if (!validStepKeys.includes(stepKey)) {
      return NextResponse.json(
        { error: "Invalid stepKey" },
        { status: 400 }
      );
    }

    // Get the seller record
    const seller = await prisma.seller.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Initialize onboarding steps if they don't exist
    await initializeOnboardingSteps(seller.id);

    // Update the onboarding step
    await updateOnboardingStep(seller.id, stepKey as OnboardingStepKey, completed);

    // Recalculate onboarding steps to ensure GPSR compliance is handled correctly
    await recalculateOnboardingSteps(seller.id);

    // Get updated data
    const [steps, progress, nextStep, isFullyActivated] = await Promise.all([
      getSellerOnboardingSteps(seller.id),
      getOnboardingProgress(seller.id),
      getNextOnboardingStep(seller.id),
      checkIsFullyActivated(seller.id)
    ]);

    // Return data in the format expected by useSellerOnboardingAPI
    // Add cache headers to prevent stale data
    return NextResponse.json({
      success: true,
      data: {
        steps,
        progress,
        nextStep,
        isFullyActivated,
        // Legacy compatibility fields
        applicationAccepted: steps.some(step => step.stepKey === 'application_approved' && step.completed),
        stripeConnected: steps.some(step => step.stepKey === 'payment_setup' && step.completed),
        shopProfileComplete: steps.some(step => step.stepKey === 'shop_naming' && step.completed),
        shippingProfileCreated: false, // This will be handled separately
        currentStep: nextStep || 'application_submitted',
        completionPercentage: progress,
        // New onboarding flow status
        shopPreferencesCompleted: steps.some(step => step.stepKey === 'shop_preferences' && step.completed),
        shopNameCompleted: steps.some(step => step.stepKey === 'shop_naming' && step.completed),
        paymentSetupCompleted: steps.some(step => step.stepKey === 'payment_setup' && step.completed),
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    console.error("Error updating onboarding step:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

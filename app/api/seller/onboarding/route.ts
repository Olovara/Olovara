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
  OnboardingStepKey,
} from "@/lib/onboarding";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

/**
 * GET /api/seller/onboarding
 * Get current onboarding status for the authenticated seller
 */
export async function GET() {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let seller: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the seller record
    seller = await prisma.seller.findUnique({
      where: { userId: session.user.id },
      select: { id: true, isFullyActivated: true },
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
      checkIsFullyActivated(seller.id),
    ]);

    // Return data in the format expected by useSellerOnboardingAPI
    // Add cache headers to prevent stale data
    return NextResponse.json(
      {
        success: true,
        data: {
          steps,
          progress,
          nextStep,
          isFullyActivated,
          // Legacy compatibility fields
          applicationAccepted: steps.some(
            (step) => step.stepKey === "application_approved" && step.completed
          ),
          stripeConnected: steps.some(
            (step) => step.stepKey === "payment_setup" && step.completed
          ),
          shopProfileComplete: steps.some(
            (step) => step.stepKey === "shop_naming" && step.completed
          ),
          shippingProfileCreated: false, // This will be handled separately
          currentStep: nextStep || "application_submitted",
          completionPercentage: progress,
          // New onboarding flow status
          shopPreferencesCompleted: steps.some(
            (step) => step.stepKey === "shop_preferences" && step.completed
          ),
          shopNameCompleted: steps.some(
            (step) => step.stepKey === "shop_naming" && step.completed
          ),
          paymentSetupCompleted: steps.some(
            (step) => step.stepKey === "payment_setup" && step.completed
          ),
        },
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching onboarding data:", error);

    // Log to database - user could email about "can't see onboarding progress"
    const userMessage = logError({
      code: "ONBOARDING_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/onboarding",
      method: "GET",
      error,
      metadata: {
        sellerId: seller?.id,
        note: "Failed to fetch seller onboarding status",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

/**
 * POST /api/seller/onboarding
 * Update an onboarding step for the authenticated seller
 */
export async function POST(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let seller: any = null;
  let body: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    body = await request.json();
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
      "handmade_verification",
      "shop_preferences",
      "shop_naming",
      "payment_setup",
      "gpsr_compliance",
    ];

    if (!validStepKeys.includes(stepKey)) {
      return NextResponse.json({ error: "Invalid stepKey" }, { status: 400 });
    }

    // Get the seller record
    seller = await prisma.seller.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Initialize onboarding steps if they don't exist
    await initializeOnboardingSteps(seller.id);

    // Update the onboarding step
    await updateOnboardingStep(
      seller.id,
      stepKey as OnboardingStepKey,
      completed
    );

    // Recalculate onboarding steps to ensure GPSR compliance is handled correctly
    await recalculateOnboardingSteps(seller.id);

    // Get updated data
    const [steps, progress, nextStep, isFullyActivated] = await Promise.all([
      getSellerOnboardingSteps(seller.id),
      getOnboardingProgress(seller.id),
      getNextOnboardingStep(seller.id),
      checkIsFullyActivated(seller.id),
    ]);

    // Return data in the format expected by useSellerOnboardingAPI
    // Add cache headers to prevent stale data
    return NextResponse.json(
      {
        success: true,
        data: {
          steps,
          progress,
          nextStep,
          isFullyActivated,
          // Legacy compatibility fields
          applicationAccepted: steps.some(
            (step) => step.stepKey === "application_approved" && step.completed
          ),
          stripeConnected: steps.some(
            (step) => step.stepKey === "payment_setup" && step.completed
          ),
          shopProfileComplete: steps.some(
            (step) => step.stepKey === "shop_naming" && step.completed
          ),
          shippingProfileCreated: false, // This will be handled separately
          currentStep: nextStep || "application_submitted",
          completionPercentage: progress,
          // New onboarding flow status
          shopPreferencesCompleted: steps.some(
            (step) => step.stepKey === "shop_preferences" && step.completed
          ),
          shopNameCompleted: steps.some(
            (step) => step.stepKey === "shop_naming" && step.completed
          ),
          paymentSetupCompleted: steps.some(
            (step) => step.stepKey === "payment_setup" && step.completed
          ),
        },
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    // Log to console (always happens)
    console.error("Error updating onboarding step:", error);

    // Log to database - user could email about "completed step but it didn't save"
    const userMessage = logError({
      code: "ONBOARDING_STEP_UPDATE_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/onboarding",
      method: "POST",
      error,
      metadata: {
        sellerId: seller?.id,
        stepKey: body?.stepKey,
        completed: body?.completed,
        note: "Failed to update onboarding step",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

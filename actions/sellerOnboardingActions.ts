"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { currentUser } from "@/lib/auth";
import {
  updateOnboardingStep,
  getSellerOnboardingSteps,
} from "@/lib/onboarding";
import { logError } from "@/lib/error-logger";

export async function markShopNamingComplete() {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let seller: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    // Get seller ID
    seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!seller) {
      throw new Error("Seller not found");
    }

    // Mark shop naming step as complete
    await updateOnboardingStep(seller.id, "shop_naming", true);

    console.log(
      "Shop naming step marked as complete for user:",
      session.user.id
    );

    return { success: true };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error marking shop naming complete:", error);

    // Don't log authentication/not found errors - they're expected
    if (
      error instanceof Error &&
      (error.message.includes("Not authenticated") ||
        error.message.includes("Seller not found"))
    ) {
      return { success: false, error: error.message };
    }

    // Log to database - user could email about "couldn't mark shop naming complete"
    const userMessage = logError({
      code: "SELLER_ONBOARDING_MARK_SHOP_NAMING_FAILED",
      userId: session?.user?.id,
      route: "actions/sellerOnboardingActions",
      method: "markShopNamingComplete",
      error,
      metadata: {
        sellerId: seller?.id,
        note: "Failed to mark shop naming step as complete",
      },
    });

    return { success: false, error: userMessage };
  }
}

export async function markShopPreferencesComplete() {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let seller: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    // Get seller ID
    seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!seller) {
      throw new Error("Seller not found");
    }

    // Mark shop preferences step as complete
    await updateOnboardingStep(seller.id, "shop_preferences", true);

    console.log(
      "Shop preferences step marked as complete for user:",
      session.user.id
    );

    return { success: true };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error marking shop preferences complete:", error);

    // Don't log authentication/not found errors - they're expected
    if (
      error instanceof Error &&
      (error.message.includes("Not authenticated") ||
        error.message.includes("Seller not found"))
    ) {
      return { success: false, error: error.message };
    }

    // Log to database - user could email about "couldn't mark shop preferences complete"
    const userMessage = logError({
      code: "SELLER_ONBOARDING_MARK_SHOP_PREFERENCES_FAILED",
      userId: session?.user?.id,
      route: "actions/sellerOnboardingActions",
      method: "markShopPreferencesComplete",
      error,
      metadata: {
        sellerId: seller?.id,
        note: "Failed to mark shop preferences step as complete",
      },
    });

    return { success: false, error: userMessage };
  }
}

export async function markPaymentSetupComplete() {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let seller: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    // Get seller ID
    seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!seller) {
      throw new Error("Seller not found");
    }

    // Mark payment setup step as complete
    await updateOnboardingStep(seller.id, "payment_setup", true);

    console.log(
      "Payment setup step marked as complete for user:",
      session.user.id
    );

    return { success: true };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error marking payment setup complete:", error);

    // Don't log authentication/not found errors - they're expected
    if (
      error instanceof Error &&
      (error.message.includes("Not authenticated") ||
        error.message.includes("Seller not found"))
    ) {
      return { success: false, error: error.message };
    }

    // Log to database - user could email about "couldn't mark payment setup complete"
    const userMessage = logError({
      code: "SELLER_ONBOARDING_MARK_PAYMENT_SETUP_FAILED",
      userId: session?.user?.id,
      route: "actions/sellerOnboardingActions",
      method: "markPaymentSetupComplete",
      error,
      metadata: {
        sellerId: seller?.id,
        note: "Failed to mark payment setup step as complete",
      },
    });

    return { success: false, error: userMessage };
  }
}

export async function markApplicationSubmitted() {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let seller: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    // Get seller ID
    seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!seller) {
      throw new Error("Seller not found");
    }

    // Mark application submitted step as complete
    await updateOnboardingStep(seller.id, "application_submitted", true);

    console.log(
      "Application submitted step marked as complete for user:",
      session.user.id
    );

    return { success: true };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error marking application submitted:", error);

    // Don't log authentication/not found errors - they're expected
    if (
      error instanceof Error &&
      (error.message.includes("Not authenticated") ||
        error.message.includes("Seller not found"))
    ) {
      return { success: false, error: error.message };
    }

    // Log to database - user could email about "couldn't mark application submitted"
    const userMessage = logError({
      code: "SELLER_ONBOARDING_MARK_APPLICATION_SUBMITTED_FAILED",
      userId: session?.user?.id,
      route: "actions/sellerOnboardingActions",
      method: "markApplicationSubmitted",
      error,
      metadata: {
        sellerId: seller?.id,
        note: "Failed to mark application submitted step as complete",
      },
    });

    return { success: false, error: userMessage };
  }
}

export async function markApplicationApproved() {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let seller: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    // Get seller ID
    seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!seller) {
      throw new Error("Seller not found");
    }

    // Mark application approved step as complete
    await updateOnboardingStep(seller.id, "application_approved", true);

    console.log(
      "Application approved step marked as complete for user:",
      session.user.id
    );

    return { success: true };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error marking application approved:", error);

    // Don't log authentication/not found errors - they're expected
    if (
      error instanceof Error &&
      (error.message.includes("Not authenticated") ||
        error.message.includes("Seller not found"))
    ) {
      return { success: false, error: error.message };
    }

    // Log to database - user could email about "couldn't mark application approved"
    const userMessage = logError({
      code: "SELLER_ONBOARDING_MARK_APPLICATION_APPROVED_FAILED",
      userId: session?.user?.id,
      route: "actions/sellerOnboardingActions",
      method: "markApplicationApproved",
      error,
      metadata: {
        sellerId: seller?.id,
        note: "Failed to mark application approved step as complete",
      },
    });

    return { success: false, error: userMessage };
  }
}

export async function getSellerOnboardingStatus(userId: string) {
  try {
    const seller = await db.seller.findUnique({
      where: { userId },
      select: {
        id: true,
        isFullyActivated: true,
      },
    });

    if (!seller) {
      return { success: false, error: "Seller profile not found" };
    }

    // Get onboarding steps
    const steps = await getSellerOnboardingSteps(seller.id);

    return {
      success: true,
      onboardingStatus: {
        isFullyActivated: seller.isFullyActivated,
        steps: steps,
      },
    };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error getting seller onboarding status:", error);

    // Don't log "not found" errors - they're expected
    if (error instanceof Error && error.message.includes("not found")) {
      return { success: false, error: error.message };
    }

    // Log to database - user could email about "can't get onboarding status"
    const userMessage = logError({
      code: "SELLER_ONBOARDING_STATUS_FETCH_FAILED",
      userId: userId,
      route: "actions/sellerOnboardingActions",
      method: "getSellerOnboardingStatus",
      error,
      metadata: {
        targetUserId: userId,
        note: "Failed to get seller onboarding status",
      },
    });

    return { success: false, error: userMessage };
  }
}

export async function updateSellerOnboardingStep(
  userId: string,
  step: string,
  completed: boolean
) {
  // Declare variables outside try block so they're accessible in catch
  let seller: any = null;

  try {
    seller = await db.seller.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!seller) {
      throw new Error("Seller not found");
    }

    // Update the specific onboarding step
    await updateOnboardingStep(seller.id, step as any, completed);

    console.log(`Onboarding step ${step} updated for user:`, userId);

    return { success: true };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error updating seller onboarding step:", error);

    // Don't log "not found" errors - they're expected
    if (error instanceof Error && error.message.includes("Seller not found")) {
      return { success: false, error: error.message };
    }

    // Log to database - user could email about "couldn't update onboarding step"
    const userMessage = logError({
      code: "SELLER_ONBOARDING_STEP_UPDATE_FAILED",
      userId: userId,
      route: "actions/sellerOnboardingActions",
      method: "updateSellerOnboardingStep",
      error,
      metadata: {
        targetUserId: userId,
        step,
        completed,
        sellerId: seller?.id,
        note: "Failed to update seller onboarding step",
      },
    });

    return { success: false, error: userMessage };
  }
}

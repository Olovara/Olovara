"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { currentUser } from "@/lib/auth";
import { updateOnboardingStep, getSellerOnboardingSteps } from "@/lib/onboarding";

export async function markShopNamingComplete() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    // Get seller ID
    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!seller) {
      throw new Error("Seller not found");
    }

    // Mark shop naming step as complete
    await updateOnboardingStep(seller.id, "shop_naming", true);

    console.log("Shop naming step marked as complete for user:", session.user.id);

    return { success: true };
  } catch (error) {
    console.error("Error marking shop naming complete:", error);
    return { success: false, error: "Failed to mark shop naming complete" };
  }
}

export async function markShopPreferencesComplete() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    // Get seller ID
    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!seller) {
      throw new Error("Seller not found");
    }

    // Mark shop preferences step as complete
    await updateOnboardingStep(seller.id, "shop_preferences", true);

    console.log("Shop preferences step marked as complete for user:", session.user.id);

    return { success: true };
  } catch (error) {
    console.error("Error marking shop preferences complete:", error);
    return { success: false, error: "Failed to mark shop preferences complete" };
  }
}

export async function markPaymentSetupComplete() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    // Get seller ID
    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!seller) {
      throw new Error("Seller not found");
    }

    // Mark payment setup step as complete
    await updateOnboardingStep(seller.id, "payment_setup", true);

    console.log("Payment setup step marked as complete for user:", session.user.id);

    return { success: true };
  } catch (error) {
    console.error("Error marking payment setup complete:", error);
    return { success: false, error: "Failed to mark payment setup complete" };
  }
}

export async function markApplicationSubmitted() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    // Get seller ID
    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!seller) {
      throw new Error("Seller not found");
    }

    // Mark application submitted step as complete
    await updateOnboardingStep(seller.id, "application_submitted", true);

    console.log("Application submitted step marked as complete for user:", session.user.id);

    return { success: true };
  } catch (error) {
    console.error("Error marking application submitted:", error);
    return { success: false, error: "Failed to mark application submitted" };
  }
}

export async function markApplicationApproved() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    // Get seller ID
    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!seller) {
      throw new Error("Seller not found");
    }

    // Mark application approved step as complete
    await updateOnboardingStep(seller.id, "application_approved", true);

    console.log("Application approved step marked as complete for user:", session.user.id);

    return { success: true };
  } catch (error) {
    console.error("Error marking application approved:", error);
    return { success: false, error: "Failed to mark application approved" };
  }
}

export async function getSellerOnboardingStatus(userId: string) {
  try {
    const seller = await db.seller.findUnique({
      where: { userId },
      select: {
        id: true,
        isFullyActivated: true,
      }
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
        steps: steps
      }
    };
  } catch (error) {
    console.error("Error getting seller onboarding status:", error);
    return { success: false, error: "Failed to get onboarding status" };
  }
}

export async function updateSellerOnboardingStep(userId: string, step: string, completed: boolean) {
  try {
    const seller = await db.seller.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!seller) {
      throw new Error("Seller not found");
    }

    // Update the specific onboarding step
    await updateOnboardingStep(seller.id, step as any, completed);

    console.log(`Onboarding step ${step} updated for user:`, userId);

    return { success: true };
  } catch (error) {
    console.error("Error updating seller onboarding step:", error);
    return { success: false, error: "Failed to update onboarding step" };
  }
} 
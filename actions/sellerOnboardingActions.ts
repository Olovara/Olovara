"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { currentUser } from "@/lib/auth";

export async function markShopProfileComplete() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    // Update seller profile to mark as complete
    await db.seller.update({
      where: { userId: session.user.id },
      data: { shopProfileComplete: true }
    });

    // Note: Session refresh is now handled by the client-side page reload
    // The user's onboarding status has been updated in the database
    console.log("Shop profile marked as complete for user:", session.user.id);

    return { success: true };
  } catch (error) {
    console.error("Error marking shop profile complete:", error);
    return { success: false, error: "Failed to mark shop profile complete" };
  }
}

export async function markStripeConnected(userId: string) {
  try {
    // Update seller to mark Stripe as connected
    await db.seller.update({
      where: { userId },
      data: { stripeConnected: true }
    });

    // Note: Session refresh is now handled by the client-side page reload
    // The user's onboarding status has been updated in the database
    console.log("Stripe marked as connected for user:", userId);

    return { success: true };
  } catch (error) {
    console.error("Error marking Stripe connected:", error);
    return { success: false, error: "Failed to mark Stripe connected" };
  }
}

export async function markShippingProfileCreated(userId: string) {
  try {
    // Update seller to mark shipping profile as created
    await db.seller.update({
      where: { userId },
      data: { shippingProfileCreated: true }
    });

    // Note: Session refresh is now handled by the client-side page reload
    // The user's onboarding status has been updated in the database
    console.log("Shipping profile marked as created for user:", userId);

    return { success: true };
  } catch (error) {
    console.error("Error marking shipping profile created:", error);
    return { success: false, error: "Failed to mark shipping profile created" };
  }
}

export async function markSellerFullyActivated(userId: string) {
  try {
    // Update seller to mark as fully activated
    await db.seller.update({
      where: { userId },
      data: { isFullyActivated: true }
    });

    // Note: Session refresh is now handled by the client-side page reload
    // The user's onboarding status has been updated in the database
    console.log("Seller marked as fully activated for user:", userId);

    return { success: true };
  } catch (error) {
    console.error("Error marking seller fully activated:", error);
    return { success: false, error: "Failed to mark seller fully activated" };
  }
}

export async function getSellerOnboardingStatus(userId: string) {
  try {
    const seller = await db.seller.findUnique({
      where: { userId },
      select: {
        applicationAccepted: true,
        stripeConnected: true,
        shopProfileComplete: true,
        shippingProfileCreated: true,
        isFullyActivated: true,
      }
    });

    if (!seller) {
      return { success: false, error: "Seller profile not found" };
    }

    return {
      success: true,
      onboardingStatus: seller
    };
  } catch (error) {
    console.error("Error getting seller onboarding status:", error);
    return { success: false, error: "Failed to get onboarding status" };
  }
}

export async function updateSellerOnboardingStep(userId: string, step: string, completed: boolean) {
  try {
    const updateData: any = {};
    
    switch (step) {
      case 'shopProfileComplete':
        updateData.shopProfileComplete = completed;
        break;
      case 'stripeConnected':
        updateData.stripeConnected = completed;
        break;
      case 'shippingProfileCreated':
        updateData.shippingProfileCreated = completed;
        break;
      case 'isFullyActivated':
        updateData.isFullyActivated = completed;
        break;
      default:
        throw new Error(`Invalid onboarding step: ${step}`);
    }

    await db.seller.update({
      where: { userId },
      data: updateData
    });

    // Note: Session refresh is now handled by the client-side page reload
    // The user's onboarding status has been updated in the database
    console.log(`Onboarding step ${step} updated for user:`, userId);

    return { success: true };
  } catch (error) {
    console.error("Error updating seller onboarding step:", error);
    return { success: false, error: "Failed to update onboarding step" };
  }
} 
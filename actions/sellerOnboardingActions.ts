"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { updateUserSession } from "@/lib/session-update";

// Action to mark shop profile as complete
export async function markShopProfileComplete() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    // Check if profile is already complete in session
    const currentOnboarding = session.user.sellerOnboarding;
    if (currentOnboarding?.shopProfileComplete) {
      // Already complete, just update session to ensure it's current
      await updateUserSession(userId);
      return { success: true };
    }

    // Update database to mark as complete
    await db.seller.update({
      where: { userId },
      data: { shopProfileComplete: true },
    });

    // Update session to reflect changes
    await updateUserSession(userId);

    return { success: true };
  } catch (error) {
    console.error("Error marking shop profile complete:", error);
    return { success: false, error: "Failed to update profile completion" };
  }
}

// Action to mark Stripe as connected
export async function markStripeConnected() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    // Check if Stripe is already connected in session
    const currentOnboarding = session.user.sellerOnboarding;
    if (currentOnboarding?.stripeConnected) {
      // Already connected, just update session to ensure it's current
      await updateUserSession(userId);
      return { success: true };
    }

    // Update database to mark as connected
    await db.seller.update({
      where: { userId },
      data: { stripeConnected: true },
    });

    // Update session to reflect changes
    await updateUserSession(userId);

    return { success: true };
  } catch (error) {
    console.error("Error marking Stripe connected:", error);
    return { success: false, error: "Failed to update Stripe connection" };
  }
}

// Action to mark shipping profile as created
export async function markShippingProfileCreated() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    // Check if shipping profile is already created in session
    const currentOnboarding = session.user.sellerOnboarding;
    if (currentOnboarding?.shippingProfileCreated) {
      // Already created, just update session to ensure it's current
      await updateUserSession(userId);
      return { success: true };
    }

    // Update database to mark as created
    await db.seller.update({
      where: { userId },
      data: { shippingProfileCreated: true },
    });

    // Update session to reflect changes
    await updateUserSession(userId);

    return { success: true };
  } catch (error) {
    console.error("Error marking shipping profile created:", error);
    return { success: false, error: "Failed to update shipping profile creation" };
  }
}

// Action to mark seller as fully activated
export async function markFullyActivated() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    // Check if seller is already fully activated in session
    const currentOnboarding = session.user.sellerOnboarding;
    if (currentOnboarding?.isFullyActivated) {
      // Already activated, just update session to ensure it's current
      await updateUserSession(userId);
      return { success: true };
    }

    // Update database to mark as fully activated
    await db.seller.update({
      where: { userId },
      data: { isFullyActivated: true },
    });

    // Update session to reflect changes
    await updateUserSession(userId);

    return { success: true };
  } catch (error) {
    console.error("Error marking seller fully activated:", error);
    return { success: false, error: "Failed to activate seller account" };
  }
}

// Action to check and update onboarding status based on current data
export async function checkAndUpdateOnboardingStatus() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    // Get current seller status
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
        shopProfileComplete: true,
        shippingProfileCreated: true,
        isFullyActivated: true,
      },
    });

    if (!seller) {
      return { success: false, error: "Seller not found" };
    }

    // Check each step and update if needed
    const profileCompleted = !!(seller.encryptedBusinessName && seller.encryptedTaxId && seller.taxIdVerified);
    const stripeConnected = seller.stripeConnected && !!seller.connectedAccountId;
    const shippingProfileCreated = seller.shippingProfiles.length > 0;
    const fullyActivated = seller.applicationAccepted && profileCompleted && stripeConnected && shippingProfileCreated;

    // Update fields if they don't match current state
    const updates: any = {};
    
    if (profileCompleted !== seller.shopProfileComplete) {
      updates.shopProfileComplete = profileCompleted;
    }
    
    if (stripeConnected !== seller.stripeConnected) {
      updates.stripeConnected = stripeConnected;
    }
    
    if (shippingProfileCreated !== seller.shippingProfileCreated) {
      updates.shippingProfileCreated = shippingProfileCreated;
    }
    
    if (fullyActivated !== seller.isFullyActivated) {
      updates.isFullyActivated = fullyActivated;
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      await db.seller.update({
        where: { userId },
        data: updates,
      });

      // Update session to reflect changes
      await updateUserSession(userId);
    }

    return { success: true };
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return { success: false, error: "Failed to check onboarding status" };
  }
} 
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { updateOnboardingStep } from "@/lib/onboarding";
import { logError } from "@/lib/error-logger";

// Helper function to check if shop naming step should be completed
async function checkAndMarkShopNamingComplete(userId: string) {
  try {
    const seller = await db.seller.findUnique({
      where: { userId },
      select: {
        id: true,
        shopName: true,
        shopDescription: true,
      },
    });

    if (!seller) return false;

    // Check if About form is completed (shop name and description are required)
    const aboutComplete =
      seller.shopName &&
      seller.shopDescription &&
      seller.shopName.trim() !== "" &&
      seller.shopDescription.trim() !== "";

    if (aboutComplete) {
      // Mark the shop_naming step as complete
      await updateOnboardingStep(seller.id, "shop_naming", true);
      console.log(`Shop naming step marked as complete for user: ${userId}`);
      return true;
    }

    return false;
  } catch (error) {
    // Log to console (always happens)
    console.error("Error checking shop profile completion:", error);

    // Log to database - user could email about "shop naming step not completing"
    logError({
      code: "SHOP_NAMING_STEP_CHECK_FAILED",
      userId,
      route: "actions/sellerAboutActions",
      method: "checkAndMarkShopNamingComplete",
      error,
      metadata: {
        note: "Failed to check and mark shop naming step as complete",
      },
    });

    return false;
  }
}

export async function updateSellerAbout(data: {
  shopName: string;
  shopTagLine?: string;
  shopDescription: string;
  shopAnnouncement?: string;
  behindTheHands?: string;
  sellerImage?: string;
  shopBannerImage?: string;
  shopLogoImage?: string;
}) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    // Check if shop name is already taken by another seller
    const existingSeller = await db.seller.findFirst({
      where: {
        shopName: data.shopName,
        userId: { not: session.user.id },
      },
    });

    if (existingSeller) {
      return { success: false, error: "Shop name is already taken" };
    }

    // Generate shop name slug
    const shopNameSlug = data.shopName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug is already taken
    const existingSlug = await db.seller.findFirst({
      where: {
        shopNameSlug: shopNameSlug,
        userId: { not: session.user.id },
      },
    });

    if (existingSlug) {
      return {
        success: false,
        error: "Shop name generates a URL that is already taken",
      };
    }

    // Update seller profile
    await db.seller.update({
      where: { userId: session.user.id },
      data: {
        shopName: data.shopName,
        shopNameSlug: shopNameSlug,
        shopTagLine: data.shopTagLine,
        shopDescription: data.shopDescription,
        shopAnnouncement: data.shopAnnouncement,
        behindTheHands: data.behindTheHands,
        sellerImage: data.sellerImage,
        shopBannerImage: data.shopBannerImage,
        shopLogoImage: data.shopLogoImage,
      },
    });

    // Check if profile should be marked as complete
    const profileCompleted = await checkAndMarkShopNamingComplete(
      session.user.id
    );

    // Note: Session refresh is now handled by the client-side page reload
    // The user's profile has been updated in the database
    console.log("Seller about information updated for user:", session.user.id);

    return {
      success: true,
      message: "Shop information updated successfully!",
      profileCompleted,
    };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error updating seller about:", error);

    // Don't log authentication errors - they're expected
    if (error instanceof Error && error.message === "Not authenticated") {
      return { success: false, error: "Not authenticated" };
    }

    // Log to database - user could email about "couldn't update shop information"
    const userMessage = logError({
      code: "SELLER_ABOUT_UPDATE_FAILED",
      userId: session?.user?.id,
      route: "actions/sellerAboutActions",
      method: "updateSellerAbout",
      error,
      metadata: {
        shopName: data.shopName,
        note: "Failed to update seller about information",
      },
    });

    return { success: false, error: userMessage };
  }
}

export const getSellerAbout = async () => {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return { error: "User not authenticated." };
    }

    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: {
        shopName: true,
        shopTagLine: true,
        shopDescription: true,
        shopAnnouncement: true,
        behindTheHands: true,
        sellerImage: true,
        shopBannerImage: true,
        shopLogoImage: true,
      },
    });

    if (!seller) {
      return { error: "Seller not found." };
    }

    return { data: seller };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching seller about:", error);

    // Log to database - user could email about "can't load shop information"
    const userMessage = logError({
      code: "SELLER_ABOUT_FETCH_FAILED",
      userId: session?.user?.id,
      route: "actions/sellerAboutActions",
      method: "getSellerAbout",
      error,
      metadata: {
        note: "Failed to fetch seller about information",
      },
    });

    return { error: userMessage };
  }
};

"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { updateOnboardingStep } from "@/lib/onboarding";

// Helper function to check if shop naming step should be completed
async function checkAndMarkShopNamingComplete(userId: string) {
  try {
    const seller = await db.seller.findUnique({
      where: { userId },
      select: {
        id: true,
        shopName: true,
        shopDescription: true,
      }
    });

    if (!seller) return false;

    // Check if About form is completed (shop name and description are required)
    const aboutComplete = seller.shopName && seller.shopDescription && seller.shopName.trim() !== "" && seller.shopDescription.trim() !== "";
    
    if (aboutComplete) {
      // Mark the shop_naming step as complete
      await updateOnboardingStep(seller.id, "shop_naming", true);
      console.log(`Shop naming step marked as complete for user: ${userId}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error checking shop profile completion:", error);
    return false;
  }
}

export async function updateSellerAbout(data: {
  shopName: string;
  shopTagLine?: string;
  shopDescription: string;
  shopAnnouncement?: string;
  sellerImage?: string;
  shopBannerImage?: string;
  shopLogoImage?: string;
}) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    // Check if shop name is already taken by another seller
    const existingSeller = await db.seller.findFirst({
      where: {
        shopName: data.shopName,
        userId: { not: session.user.id }
      }
    });

    if (existingSeller) {
      return { success: false, error: "Shop name is already taken" };
    }

    // Generate shop name slug
    const shopNameSlug = data.shopName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug is already taken
    const existingSlug = await db.seller.findFirst({
      where: {
        shopNameSlug: shopNameSlug,
        userId: { not: session.user.id }
      }
    });

    if (existingSlug) {
      return { success: false, error: "Shop name generates a URL that is already taken" };
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
        sellerImage: data.sellerImage,
        shopBannerImage: data.shopBannerImage,
        shopLogoImage: data.shopLogoImage,
      }
    });

    // Check if profile should be marked as complete
    const profileCompleted = await checkAndMarkShopNamingComplete(session.user.id);

    // Note: Session refresh is now handled by the client-side page reload
    // The user's profile has been updated in the database
    console.log("Seller about information updated for user:", session.user.id);

    const message = profileCompleted 
      ? "Shop information updated successfully! Your shop profile is now complete." 
      : "Shop information updated successfully!";

    return { success: true, message, profileCompleted };
  } catch (error) {
    console.error("Error updating seller about:", error);
    return { success: false, error: "Failed to update seller information" };
  }
}

export const getSellerAbout = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  try {
    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: {
        shopName: true,
        shopTagLine: true,
        shopDescription: true,
        shopAnnouncement: true,
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
    console.error("Error fetching seller about:", error);
    return { error: "Something went wrong while fetching shop information." };
  }
}; 
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

// Helper function to check if all three forms are completed
async function checkAndMarkProfileComplete(userId: string) {
  try {
    const seller = await db.seller.findUnique({
      where: { userId },
      select: {
        shopName: true,
        shopDescription: true,
        shopCountry: true,
        preferredCurrency: true,
        preferredWeightUnit: true,
        preferredDimensionUnit: true,
        preferredDistanceUnit: true,
        shopProfileComplete: true,
      }
    });

    if (!seller) return false;

    // Check if About form is completed (shop name and description are required)
    const aboutComplete = seller.shopName && seller.shopDescription && seller.shopName.trim() !== "" && seller.shopDescription.trim() !== "";
    
    // Check if Info form is completed (shop country is required)
    const infoComplete = seller.shopCountry && seller.shopCountry.trim() !== "";
    
    // Check if Preferences form is completed (all unit preferences are set)
    const preferencesComplete = seller.preferredCurrency && seller.preferredWeightUnit && seller.preferredDimensionUnit && seller.preferredDistanceUnit;

    // If all three forms are complete and profile isn't already marked complete
    if (aboutComplete && infoComplete && preferencesComplete && !seller.shopProfileComplete) {
      await db.seller.update({
        where: { userId },
        data: { shopProfileComplete: true }
      });
      
      console.log(`Shop profile marked as complete for user: ${userId}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error checking profile completion:", error);
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
    const profileCompleted = await checkAndMarkProfileComplete(session.user.id);

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
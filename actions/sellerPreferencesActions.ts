"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { updateOnboardingStep } from "@/lib/onboarding";

// Helper function to check if shop preferences step should be completed
async function checkAndMarkShopPreferencesComplete(userId: string) {
  try {
    const seller = await db.seller.findUnique({
      where: { userId },
      select: {
        id: true,
        shopName: true,
        shopDescription: true,
        shopCountry: true,
        preferredCurrency: true,
        preferredWeightUnit: true,
        preferredDimensionUnit: true,
        preferredDistanceUnit: true,
      }
    });

    if (!seller) return false;

    // Check if About form is completed (shop name and description are required)
    const aboutComplete = seller.shopName && seller.shopDescription && seller.shopName.trim() !== "" && seller.shopDescription.trim() !== "";

    // Check if Info form is completed (shop country is required)
    const infoComplete = seller.shopCountry && seller.shopCountry.trim() !== "";

    // Check if Preferences form is completed (all unit preferences are set)
    const preferencesComplete = seller.preferredCurrency && seller.preferredWeightUnit && seller.preferredDimensionUnit && seller.preferredDistanceUnit;

    // If all three forms are complete
    if (aboutComplete && infoComplete && preferencesComplete) {
      // Mark the shop_preferences step as complete
      await updateOnboardingStep(seller.id, "shop_preferences", true);
      console.log(`Shop preferences step marked as complete for user: ${userId}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error checking shop preferences completion:", error);
    return false;
  }
}

export async function updateSellerPreferences(data: {
  preferredCurrency: string;
  preferredWeightUnit: string;
  preferredDimensionUnit: string;
  preferredDistanceUnit: string;
  shopValues: string[];
  valuesPreferNotToSay: boolean;
}) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    // Update seller preferences
    await db.seller.update({
      where: { userId: session.user.id },
      data: {
        preferredCurrency: data.preferredCurrency,
        preferredWeightUnit: data.preferredWeightUnit,
        preferredDimensionUnit: data.preferredDimensionUnit,
        preferredDistanceUnit: data.preferredDistanceUnit,
        shopValues: data.shopValues,
        valuesPreferNotToSay: data.valuesPreferNotToSay,
      }
    });

    // Check if profile should be marked as complete
    const profileCompleted = await checkAndMarkShopPreferencesComplete(session.user.id);

    // Note: Session refresh is now handled by the client-side page reload
    // The user's preferences have been updated in the database
    console.log("Seller preferences updated for user:", session.user.id);

    const message = profileCompleted
      ? "Preferences updated successfully! Your shop profile is now complete."
      : "Preferences updated successfully!";

    return { success: true, message, profileCompleted };
  } catch (error) {
    console.error("Error updating seller preferences:", error);
    return { success: false, error: "Failed to update seller preferences" };
  }
}

export const getSellerPreferences = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  try {
    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: {
        preferredCurrency: true,
        preferredWeightUnit: true,
        preferredDimensionUnit: true,
        preferredDistanceUnit: true,
        shopValues: true,
        valuesPreferNotToSay: true,
      },
    });

    if (!seller) {
      return { error: "Seller not found." };
    }

    return { data: seller };
  } catch (error) {
    console.error("Error fetching seller preferences:", error);
    return { error: "Something went wrong while fetching preferences." };
  }
}; 
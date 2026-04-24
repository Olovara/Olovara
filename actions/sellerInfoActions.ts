"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { encryptLocationInfo, decryptLocationInfo } from "@/lib/encryption";
import { updateOnboardingStep } from "@/lib/onboarding";
import { getCurrencyDecimals, minorToMajorAmount } from "@/data/units";

// Helper function to check if shop preferences step should be completed
async function checkAndMarkShopPreferencesComplete(userId: string) {
  try {
    const seller = await db.seller.findUnique({
      where: { userId },
      select: {
        id: true,
        shopCountry: true,
        preferredCurrency: true,
        preferredWeightUnit: true,
        preferredDimensionUnit: true,
        preferredDistanceUnit: true,
      },
    });

    if (!seller) return false;

    // Check if Info form is completed (shop country is required)
    const infoComplete = seller.shopCountry && seller.shopCountry.trim() !== "";

    // Check if Preferences form is completed (all unit preferences are set)
    const preferencesComplete =
      seller.preferredCurrency &&
      seller.preferredWeightUnit &&
      seller.preferredDimensionUnit &&
      seller.preferredDistanceUnit;

    // If both info and preferences are complete
    if (infoComplete && preferencesComplete) {
      // Mark the shop_preferences step as complete
      await updateOnboardingStep(seller.id, "shop_preferences", true);
      console.log(
        `Shop preferences step marked as complete for user: ${userId}`,
      );
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error checking shop preferences completion:", error);
    return false;
  }
}

export async function updateSellerInfo(data: {
  // Location fields
  shopCountry: string;
  shopState?: string;
  shopCity?: string;
  // Shop settings
  acceptsCustom?: boolean;
  /** Minor units in preferredCurrency; omit or null when no minimum or custom orders off */
  customOrderMinBudgetMinor?: number | null;
  /** Null/omit = unlimited; otherwise positive integer cap */
  customOrderMaxOpenOrders?: number | null;
}) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    // Encrypt location information
    const encryptedLocation = encryptLocationInfo({
      state: data.shopState,
      city: data.shopCity,
    });

    // Update seller information
    await db.seller.update({
      where: { userId: session.user.id },
      data: {
        shopCountry: data.shopCountry,
        // Store encrypted location data
        encryptedShopState: encryptedLocation.encryptedState,
        shopStateIV: encryptedLocation.stateIV,
        shopStateSalt: encryptedLocation.stateSalt,
        encryptedShopCity: encryptedLocation.encryptedCity,
        shopCityIV: encryptedLocation.cityIV,
        shopCitySalt: encryptedLocation.citySalt,
        // Update shop settings
        acceptsCustom: data.acceptsCustom,
        customOrderMinBudgetMinor:
          data.acceptsCustom === true
            ? (data.customOrderMinBudgetMinor ?? null)
            : null,
        customOrderMaxOpenOrders:
          data.acceptsCustom === true
            ? (data.customOrderMaxOpenOrders ?? null)
            : null,
      },
    });

    // Check if profile should be marked as complete
    const profileCompleted = await checkAndMarkShopPreferencesComplete(
      session.user.id,
    );

    // Note: Session refresh is now handled by the client-side page reload
    // The user's tax information has been updated in the database
    console.log(
      "Seller location information updated for user:",
      session.user.id,
    );

    const message = profileCompleted
      ? "Location information updated successfully! Your shop profile is now complete."
      : "Location information updated successfully!";

    return { success: true, message, profileCompleted };
  } catch (error) {
    console.error("Error updating seller location information:", error);
    return {
      success: false,
      error: "Failed to update seller location information",
    };
  }
}

export const getSellerInfo = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  try {
    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: {
        acceptsCustom: true,
        preferredCurrency: true,
        customOrderMinBudgetMinor: true,
        customOrderMaxOpenOrders: true,
        shopCountry: true,
        encryptedShopState: true,
        shopStateIV: true,
        shopStateSalt: true,
        encryptedShopCity: true,
        shopCityIV: true,
        shopCitySalt: true,
        facebookUrl: true,
        instagramUrl: true,
        pinterestUrl: true,
        tiktokUrl: true,
        user: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!seller) {
      return { error: "Seller not found." };
    }

    // Decrypt location data
    const decryptedLocation = decryptLocationInfo({
      encryptedState: seller.encryptedShopState || undefined,
      stateIV: seller.shopStateIV || undefined,
      stateSalt: seller.shopStateSalt || undefined,
      encryptedCity: seller.encryptedShopCity || undefined,
      cityIV: seller.shopCityIV || undefined,
      citySalt: seller.shopCitySalt || undefined,
    });

    const prefCur = seller.preferredCurrency || "USD";
    const minor = seller.customOrderMinBudgetMinor;
    let customOrderMinBudgetInput = "";
    if (minor != null && minor >= 0) {
      const major = minorToMajorAmount(minor, prefCur);
      const d = getCurrencyDecimals(prefCur);
      customOrderMinBudgetInput =
        d === 0
          ? String(Math.round(major))
          : String(parseFloat(major.toFixed(d)));
    }

    const customOrderMaxOpenOrdersInput =
      seller.customOrderMaxOpenOrders != null &&
      seller.customOrderMaxOpenOrders > 0
        ? String(seller.customOrderMaxOpenOrders)
        : "";

    const data = {
      isVacationMode: seller.user.status === "VACATION",
      acceptsCustom: seller.acceptsCustom,
      preferredCurrency: prefCur,
      customOrderMinBudgetInput,
      customOrderMaxOpenOrdersInput,
      shopCountry: seller.shopCountry || "US",
      shopState: decryptedLocation.state || "",
      shopCity: decryptedLocation.city || "",
      facebookUrl: seller.facebookUrl || "",
      instagramUrl: seller.instagramUrl || "",
      pinterestUrl: seller.pinterestUrl || "",
      tiktokUrl: seller.tiktokUrl || "",
    };

    return { data };
  } catch (error) {
    console.error("Error fetching seller info:", error);
    return {
      error: "Something went wrong while fetching location information.",
    };
  }
};

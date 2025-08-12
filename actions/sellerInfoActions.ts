"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { encryptLocationInfo, decryptLocationInfo } from "@/lib/encryption";

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
    
    // Check if Info form is completed (shop name and location are required)
    const infoComplete = seller.shopName && seller.shopCountry && seller.shopName.trim() !== "" && seller.shopName !== "Temporary Shop Name";
    
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

export async function updateSellerInfo(data: {
  // Location fields
  shopCountry: string;
  shopState?: string;
  shopCity?: string;
  // Shop settings
  acceptsCustom?: boolean;
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
      }
    });

    // Check if profile should be marked as complete
    const profileCompleted = await checkAndMarkProfileComplete(session.user.id);

    // Note: Session refresh is now handled by the client-side page reload
    // The user's tax information has been updated in the database
    console.log("Seller location information updated for user:", session.user.id);

    const message = profileCompleted 
      ? "Location information updated successfully! Your shop profile is now complete." 
      : "Location information updated successfully!";

    return { success: true, message, profileCompleted };
  } catch (error) {
    console.error("Error updating seller location information:", error);
    return { success: false, error: "Failed to update seller location information" };
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
          }
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

    const data = {
      isVacationMode: seller.user.status === "VACATION",
      acceptsCustom: seller.acceptsCustom,
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
    return { error: "Something went wrong while fetching location information." };
  }
}; 
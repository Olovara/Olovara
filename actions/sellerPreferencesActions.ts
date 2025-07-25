"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// Helper function to check if all three forms are completed
async function checkAndMarkProfileComplete(userId: string) {
  try {
    const seller = await db.seller.findUnique({
      where: { userId },
      select: {
        shopName: true,
        shopDescription: true,
        encryptedBusinessName: true,
        businessNameIV: true,
        businessNameSalt: true,
        encryptedTaxId: true,
        taxIdIV: true,
        taxIdSalt: true,
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
    
    // Check if Info form is completed (business name and tax ID are required)
    // We need to decrypt and check if they're not temporary values
    let infoComplete = false;
    try {
      if (seller.encryptedBusinessName && seller.encryptedTaxId) {
        const { decryptData } = await import("@/lib/encryption");
        
        // Decrypt the business name and tax ID
        const businessName = decryptData(
          seller.encryptedBusinessName, 
          seller.businessNameIV, 
          seller.businessNameSalt
        );
        const taxId = decryptData(
          seller.encryptedTaxId, 
          seller.taxIdIV, 
          seller.taxIdSalt
        );
        
        // Check if they're not temporary values
        infoComplete = businessName !== "Temporary Business Name" && taxId !== "Temporary Tax ID";
      }
    } catch (error) {
      console.error("Error decrypting business info:", error);
      infoComplete = false;
    }
    
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

export async function updateSellerPreferences(data: {
  preferredCurrency: string;
  preferredWeightUnit: string;
  preferredDimensionUnit: string;
  preferredDistanceUnit: string;
  isWomanOwned: boolean;
  isMinorityOwned: boolean;
  isLGBTQOwned: boolean;
  isVeteranOwned: boolean;
  isSustainable: boolean;
  isCharitable: boolean;
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
        isWomanOwned: data.isWomanOwned,
        isMinorityOwned: data.isMinorityOwned,
        isLGBTQOwned: data.isLGBTQOwned,
        isVeteranOwned: data.isVeteranOwned,
        isSustainable: data.isSustainable,
        isCharitable: data.isCharitable,
        valuesPreferNotToSay: data.valuesPreferNotToSay,
      }
    });

    // Check if profile should be marked as complete
    const profileCompleted = await checkAndMarkProfileComplete(session.user.id);

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
        isWomanOwned: true,
        isMinorityOwned: true,
        isLGBTQOwned: true,
        isVeteranOwned: true,
        isSustainable: true,
        isCharitable: true,
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
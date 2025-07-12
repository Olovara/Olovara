"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

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

    // Note: Session refresh is now handled by the client-side page reload
    // The user's preferences have been updated in the database
    console.log("Seller preferences updated for user:", session.user.id);

    return { success: true, message: "Preferences updated successfully!" };
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
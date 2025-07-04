"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { SellerPreferencesSchema } from "@/schemas/SellerPreferencesSchema";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { Permission } from "@/data/roles-and-permissions";
import { updateUserSession } from "@/lib/session-update";

export const updateSellerPreferences = async (values: z.infer<typeof SellerPreferencesSchema>) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  const canManageSettings = await hasPermission(session.user.id, "MANAGE_SELLER_SETTINGS" as Permission);
  if (!canManageSettings) {
    return { error: "You don't have permission to perform this action." };
  }

  const validatedFields = SellerPreferencesSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields." };
  }

  const { 
    preferredCurrency, 
    preferredWeightUnit, 
    preferredDimensionUnit, 
    preferredDistanceUnit,
    isWomanOwned,
    isMinorityOwned,
    isLGBTQOwned,
    isVeteranOwned,
    isSustainable,
    isCharitable,
    valuesPreferNotToSay
  } = validatedFields.data;

  try {
    // Update seller preferences
    await db.seller.update({
      where: { userId: session.user.id },
      data: {
        preferredCurrency,
        preferredWeightUnit,
        preferredDimensionUnit,
        preferredDistanceUnit,
        isWomanOwned,
        isMinorityOwned,
        isLGBTQOwned,
        isVeteranOwned,
        isSustainable,
        isCharitable,
        valuesPreferNotToSay,
      },
    });

    // Update session to reflect changes
    await updateUserSession(session.user.id);

    return { success: "Preferences updated successfully." };
  } catch (error) {
    console.error("Error updating seller preferences:", error);
    return { error: "Something went wrong while updating preferences." };
  }
};

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
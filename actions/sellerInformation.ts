"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function updateSellerInformation(data: {
  shopName: string;
  shopDescription: string;
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

    // No longer need to encrypt tax information since we removed tax fields

    // Update seller information
    await db.seller.update({
      where: { userId: session.user.id },
      data: {
        shopName: data.shopName,
        shopNameSlug: shopNameSlug,
        shopDescription: data.shopDescription,
        shopValues: data.shopValues,
        valuesPreferNotToSay: data.valuesPreferNotToSay,
        preferredCurrency: data.preferredCurrency,
        preferredWeightUnit: data.preferredWeightUnit,
        preferredDimensionUnit: data.preferredDimensionUnit,
        preferredDistanceUnit: data.preferredDistanceUnit,
        // Tax fields removed - Stripe handles tax information
      }
    });

    // Note: Session refresh is now handled by the client-side page reload
    // The user's information has been updated in the database
    console.log("Seller information updated for user:", session.user.id);

    return { success: true, message: "Seller information updated successfully!" };
  } catch (error) {
    console.error("Error updating seller information:", error);
    return { success: false, error: "Failed to update seller information" };
  }
}
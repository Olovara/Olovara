"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { encryptSellerTaxInfo } from "@/lib/encryption";
import { currentUser } from "@/lib/auth";

export async function updateSellerInformation(data: {
  shopName: string;
  shopDescription: string;
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
  // Plain text tax information (will be encrypted internally)
  businessName: string;
  taxId: string;
  businessAddress: string;
  businessCity: string;
  businessState?: string;
  businessPostalCode: string;
  taxCountry: string;
  additionalTaxRegistrations?: string;
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

    // Encrypt the tax information using the helper function
    const encryptedTaxInfo = encryptSellerTaxInfo({
      businessName: data.businessName,
      taxId: data.taxId,
      additionalTaxRegistrations: data.additionalTaxRegistrations,
    });

    // Update seller information
    await db.seller.update({
      where: { userId: session.user.id },
      data: {
        shopName: data.shopName,
        shopNameSlug: shopNameSlug,
        shopDescription: data.shopDescription,
        isWomanOwned: data.isWomanOwned,
        isMinorityOwned: data.isMinorityOwned,
        isLGBTQOwned: data.isLGBTQOwned,
        isVeteranOwned: data.isVeteranOwned,
        isSustainable: data.isSustainable,
        isCharitable: data.isCharitable,
        valuesPreferNotToSay: data.valuesPreferNotToSay,
        preferredCurrency: data.preferredCurrency,
        preferredWeightUnit: data.preferredWeightUnit,
        preferredDimensionUnit: data.preferredDimensionUnit,
        preferredDistanceUnit: data.preferredDistanceUnit,
        // Use the encrypted tax information
        encryptedBusinessName: encryptedTaxInfo.encryptedBusinessName,
        businessNameIV: encryptedTaxInfo.businessNameIV,
        businessNameSalt: encryptedTaxInfo.businessNameSalt,
        encryptedTaxId: encryptedTaxInfo.encryptedTaxId,
        taxIdIV: encryptedTaxInfo.taxIdIV,
        taxIdSalt: encryptedTaxInfo.taxIdSalt,
        encryptedAdditionalTaxRegistrations: encryptedTaxInfo.encryptedAdditionalTaxRegistrations,
        additionalTaxRegistrationsIV: encryptedTaxInfo.additionalTaxRegistrationsIV,
        additionalTaxRegistrationsSalt: encryptedTaxInfo.additionalTaxRegistrationsSalt,
        taxCountry: data.taxCountry,
        taxIdVerified: false, // Reset verification when tax info is updated
        taxIdVerificationDate: null,
        taxIdVerificationMethod: null,
        taxIdVerificationNotes: null,
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
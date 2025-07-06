"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { SellerInfoSchema } from "@/schemas/SellerInfoSchema";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { Permission } from "@/data/roles-and-permissions";
import { encryptData } from "@/lib/encryption";
import { updateUserSession } from "@/lib/session-update";

export const updateSellerInfo = async (values: z.infer<typeof SellerInfoSchema>) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  const canManageSettings = await hasPermission(session.user.id, "MANAGE_SELLER_SETTINGS" as Permission);
  if (!canManageSettings) {
    return { error: "You don't have permission to perform this action." };
  }

  const validatedFields = SellerInfoSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields." };
  }

  const { 
    isVacationMode,
    acceptsCustom,
    businessName, 
    taxId, 
    businessAddress, 
    businessCity, 
    businessState, 
    businessPostalCode, 
    taxCountry, 
    additionalTaxRegistrations,
    facebookUrl,
    instagramUrl,
    twitterUrl,
    pinterestUrl,
    tiktokUrl
  } = validatedFields.data;

  try {
    // Encrypt sensitive tax information
    const encryptedBusinessName = encryptData(businessName);
    const encryptedTaxId = encryptData(taxId);
    const encryptedAdditionalTaxRegistrations = additionalTaxRegistrations ? encryptData(additionalTaxRegistrations) : null;

    // Update seller information
    await db.seller.update({
      where: { userId: session.user.id },
      data: {
        acceptsCustom,
        encryptedBusinessName: encryptedBusinessName.encrypted,
        businessNameIV: encryptedBusinessName.iv,
        businessNameSalt: encryptedBusinessName.salt,
        encryptedTaxId: encryptedTaxId.encrypted,
        taxIdIV: encryptedTaxId.iv,
        taxIdSalt: encryptedTaxId.salt,
        taxCountry,
        encryptedAdditionalTaxRegistrations: encryptedAdditionalTaxRegistrations?.encrypted || null,
        additionalTaxRegistrationsIV: encryptedAdditionalTaxRegistrations?.iv || null,
        additionalTaxRegistrationsSalt: encryptedAdditionalTaxRegistrations?.salt || null,
        facebookUrl: facebookUrl || null,
        instagramUrl: instagramUrl || null,
        twitterUrl: twitterUrl || null,
        pinterestUrl: pinterestUrl || null,
        tiktokUrl: tiktokUrl || null,
      },
    });

    // Update user status for vacation mode
    await db.user.update({
      where: { id: session.user.id },
      data: {
        status: isVacationMode ? "VACATION" : "ACTIVE",
      },
    });

    // Update session to reflect changes
    await updateUserSession(session.user.id);

    return { success: "Business information updated successfully." };
  } catch (error) {
    console.error("Error updating seller info:", error);
    return { error: "Something went wrong while updating business information." };
  }
};

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
        encryptedBusinessName: true,
        businessNameIV: true,
        businessNameSalt: true,
        encryptedTaxId: true,
        taxIdIV: true,
        taxIdSalt: true,
        taxCountry: true,
        encryptedAdditionalTaxRegistrations: true,
        additionalTaxRegistrationsIV: true,
        additionalTaxRegistrationsSalt: true,
        facebookUrl: true,
        instagramUrl: true,
        twitterUrl: true,
        pinterestUrl: true,
        tiktokUrl: true,
        user: {
          select: {
            status: true,
          }
        },
        addresses: {
          where: { isBusinessAddress: true },
          select: {
            encryptedStreet: true,
            streetIV: true,
            streetSalt: true,
            encryptedCity: true,
            cityIV: true,
            citySalt: true,
            encryptedState: true,
            stateIV: true,
            stateSalt: true,
            encryptedPostal: true,
            postalIV: true,
            postalSalt: true,
          }
        }
      },
    });

    if (!seller) {
      return { error: "Seller not found." };
    }

    // Decrypt the data
    const { decryptData } = await import("@/lib/encryption");
    
    const businessAddress = seller.addresses[0];
    
    const decryptedData = {
      isVacationMode: seller.user.status === "VACATION",
      acceptsCustom: seller.acceptsCustom,
      businessName: decryptData(seller.encryptedBusinessName, seller.businessNameIV, seller.businessNameSalt),
      taxId: decryptData(seller.encryptedTaxId, seller.taxIdIV, seller.taxIdSalt),
      taxCountry: seller.taxCountry,
      additionalTaxRegistrations: seller.encryptedAdditionalTaxRegistrations 
        ? decryptData(seller.encryptedAdditionalTaxRegistrations, seller.additionalTaxRegistrationsIV!, seller.additionalTaxRegistrationsSalt!)
        : "",
      businessAddress: businessAddress ? decryptData(businessAddress.encryptedStreet, businessAddress.streetIV, businessAddress.streetSalt) : "",
      businessCity: businessAddress ? decryptData(businessAddress.encryptedCity, businessAddress.cityIV, businessAddress.citySalt) : "",
      businessState: businessAddress && businessAddress.encryptedState 
        ? decryptData(businessAddress.encryptedState, businessAddress.stateIV!, businessAddress.stateSalt!)
        : "",
      businessPostalCode: businessAddress ? decryptData(businessAddress.encryptedPostal, businessAddress.postalIV, businessAddress.postalSalt) : "",
      facebookUrl: seller.facebookUrl || "",
      instagramUrl: seller.instagramUrl || "",
      twitterUrl: seller.twitterUrl || "",
      pinterestUrl: seller.pinterestUrl || "",
      tiktokUrl: seller.tiktokUrl || "",
    };

    return { data: decryptedData };
  } catch (error) {
    console.error("Error fetching seller info:", error);
    return { error: "Something went wrong while fetching business information." };
  }
}; 
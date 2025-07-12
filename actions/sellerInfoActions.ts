"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { encryptSellerTaxInfo } from "@/lib/encryption";
import { currentUser } from "@/lib/auth";

export async function updateSellerInfo(data: {
  // Plain text tax information (will be encrypted internally)
  businessName: string;
  taxId: string;
  additionalTaxRegistrations?: string;
  taxCountry: string;
}) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    // Encrypt the tax information using the helper function
    const encryptedTaxInfo = encryptSellerTaxInfo({
      businessName: data.businessName,
      taxId: data.taxId,
      additionalTaxRegistrations: data.additionalTaxRegistrations,
    });

    // Update seller tax information
    await db.seller.update({
      where: { userId: session.user.id },
      data: {
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
    // The user's tax information has been updated in the database
    console.log("Seller tax information updated for user:", session.user.id);

    return { success: true, message: "Business information updated successfully!" };
  } catch (error) {
    console.error("Error updating seller tax information:", error);
    return { success: false, error: "Failed to update seller tax information" };
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
      pinterestUrl: seller.pinterestUrl || "",
      tiktokUrl: seller.tiktokUrl || "",
    };

    return { data: decryptedData };
  } catch (error) {
    console.error("Error fetching seller info:", error);
    return { error: "Something went wrong while fetching business information." };
  }
}; 
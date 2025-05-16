"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { decryptData } from "@/lib/encryption";
import { Seller } from "@prisma/client";

type TaxCountry = "US" | "CA" | "GB" | "EU" | "AU" | "JP" | "IN" | "SG";

type SellerData = {
  shopName: string;
  shopDescription: string | null;
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
  encryptedBusinessName: string;
  businessNameIV: string;
  businessNameSalt: string;
  encryptedTaxId: string;
  taxIdIV: string;
  taxIdSalt: string;
  taxCountry: string;
  encryptedAdditionalTaxRegistrations: string | null;
  additionalTaxRegistrationsIV: string | null;
  additionalTaxRegistrationsSalt: string | null;
  addresses: {
    encryptedStreet: string;
    streetIV: string;
    streetSalt: string;
    encryptedCity: string;
    cityIV: string;
    citySalt: string;
    encryptedState: string | null;
    stateIV: string | null;
    stateSalt: string | null;
    encryptedPostal: string;
    postalIV: string;
    postalSalt: string;
    encryptedCountry: string;
    countryIV: string;
    countrySalt: string;
  }[];
};

export const getSellerData = async () => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "User not authenticated." };
    }

    const seller = await db.seller.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        shopName: true,
        shopDescription: true,
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
        addresses: {
          where: {
            isBusinessAddress: true
          },
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
            encryptedCountry: true,
            countryIV: true,
            countrySalt: true,
          }
        }
      },
    }) as SellerData | null;

    if (!seller) {
      return { error: "Seller not found." };
    }

    // Decrypt business name
    const businessName = await decryptData(
      seller.encryptedBusinessName,
      seller.businessNameIV,
      seller.businessNameSalt
    );

    // Decrypt tax ID
    const taxId = await decryptData(
      seller.encryptedTaxId,
      seller.taxIdIV,
      seller.taxIdSalt
    );

    // Decrypt additional tax registrations if they exist
    let additionalTaxRegistrations = null;
    if (seller.encryptedAdditionalTaxRegistrations) {
      additionalTaxRegistrations = await decryptData(
        seller.encryptedAdditionalTaxRegistrations,
        seller.additionalTaxRegistrationsIV!,
        seller.additionalTaxRegistrationsSalt!
      );
    }

    // Decrypt address if it exists
    let decryptedAddress = {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    };

    if (seller.addresses.length > 0) {
      const address = seller.addresses[0];
      decryptedAddress = {
        street: await decryptData(address.encryptedStreet, address.streetIV, address.streetSalt),
        city: await decryptData(address.encryptedCity, address.cityIV, address.citySalt),
        state: address.encryptedState ? await decryptData(address.encryptedState, address.stateIV!, address.stateSalt!) : "",
        postalCode: await decryptData(address.encryptedPostal, address.postalIV, address.postalSalt),
        country: await decryptData(address.encryptedCountry, address.countryIV, address.countrySalt),
      };
    }

    // Format the data for the form
    const formattedData = {
      shopName: seller.shopName || "",
      shopDescription: seller.shopDescription || "",
      preferredCurrency: seller.preferredCurrency || "USD",
      preferredWeightUnit: seller.preferredWeightUnit || "lbs",
      preferredDimensionUnit: seller.preferredDimensionUnit || "in",
      preferredDistanceUnit: seller.preferredDistanceUnit || "miles",
      isWomanOwned: seller.isWomanOwned || false,
      isMinorityOwned: seller.isMinorityOwned || false,
      isLGBTQOwned: seller.isLGBTQOwned || false,
      isVeteranOwned: seller.isVeteranOwned || false,
      isSustainable: seller.isSustainable || false,
      isCharitable: seller.isCharitable || false,
      valuesPreferNotToSay: seller.valuesPreferNotToSay || false,
      businessName: businessName || "",
      taxId: taxId || "",
      businessAddress: decryptedAddress.street || "",
      businessCity: decryptedAddress.city || "",
      businessState: decryptedAddress.state || "",
      businessPostalCode: decryptedAddress.postalCode || "",
      taxCountry: seller.taxCountry as TaxCountry,
      additionalTaxRegistrations: additionalTaxRegistrations || "",
    };

    return { data: formattedData };
  } catch (error) {
    console.error("Error fetching seller data:", error);
    return { error: "Failed to fetch seller data." };
  }
}; 
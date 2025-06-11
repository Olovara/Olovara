"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { decryptData } from "@/lib/encryption";
import { Seller } from "@prisma/client";
import { getOnboardingCountries } from "@/data/countries";

// Get supported country codes from the countries data file
const SUPPORTED_COUNTRY_CODES = getOnboardingCountries().map(country => country.code);
type TaxCountry = typeof SUPPORTED_COUNTRY_CODES[number];

interface SellerData extends Partial<Seller> {
  shopName?: string;
  shopDescription?: string;
  preferredCurrency?: string;
  preferredWeightUnit?: string;
  preferredDimensionUnit?: string;
  preferredDistanceUnit?: string;
  isWomanOwned?: boolean;
  isMinorityOwned?: boolean;
  isLGBTQOwned?: boolean;
  isVeteranOwned?: boolean;
  isSustainable?: boolean;
  isCharitable?: boolean;
  valuesPreferNotToSay?: boolean;
  businessName?: string;
  taxId?: string;
  taxCountry?: TaxCountry;
  additionalTaxRegistrations?: string;
  businessAddress?: {
    street?: string;
    street2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  addresses?: {
    encryptedStreet: string;
    streetIV: string;
    streetSalt: string;
    encryptedStreet2?: string;
    street2IV?: string;
    street2Salt?: string;
    encryptedCity: string;
    cityIV: string;
    citySalt: string;
    encryptedState?: string;
    stateIV?: string;
    stateSalt?: string;
    encryptedPostal: string;
    postalIV: string;
    postalSalt: string;
    encryptedCountry: string;
    countryIV: string;
    countrySalt: string;
    isDefault: boolean;
    isBusinessAddress: boolean;
  }[];
}

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
            encryptedStreet2: true,
            street2IV: true,
            street2Salt: true,
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
            isDefault: true,
            isBusinessAddress: true
          }
        }
      },
    }) as SellerData | null;

    if (!seller) {
      return { error: "Seller not found." };
    }

    // Decrypt all encrypted fields
    const decryptedData: SellerData = {
      ...seller,
      businessName: seller.encryptedBusinessName ? 
        await decryptData(seller.encryptedBusinessName, seller.businessNameIV!, seller.businessNameSalt!) : undefined,
      taxId: seller.encryptedTaxId ? 
        await decryptData(seller.encryptedTaxId, seller.taxIdIV!, seller.taxIdSalt!) : undefined,
      additionalTaxRegistrations: seller.encryptedAdditionalTaxRegistrations ? 
        await decryptData(seller.encryptedAdditionalTaxRegistrations, seller.additionalTaxRegistrationsIV!, seller.additionalTaxRegistrationsSalt!) : undefined,
    };

    // Decrypt address if it exists
    if (seller.addresses && seller.addresses.length > 0) {
      const address = seller.addresses[0];
      decryptedData.businessAddress = {
        street: await decryptData(address.encryptedStreet, address.streetIV, address.streetSalt),
        street2: address.encryptedStreet2 ? 
          await decryptData(address.encryptedStreet2, address.street2IV!, address.street2Salt!) : undefined,
        city: await decryptData(address.encryptedCity, address.cityIV, address.citySalt),
        state: address.encryptedState ? 
          await decryptData(address.encryptedState, address.stateIV!, address.stateSalt!) : undefined,
        postalCode: await decryptData(address.encryptedPostal, address.postalIV, address.postalSalt),
        country: await decryptData(address.encryptedCountry, address.countryIV, address.countrySalt),
      };
    }

    // Remove encrypted fields from the response
    const { 
      encryptedBusinessName, businessNameIV, businessNameSalt,
      encryptedTaxId, taxIdIV, taxIdSalt,
      encryptedAdditionalTaxRegistrations, additionalTaxRegistrationsIV, additionalTaxRegistrationsSalt,
      addresses,
      ...cleanData 
    } = decryptedData;

    return { data: cleanData };
  } catch (error) {
    console.error("Error getting seller data:", error);
    return { error: "Failed to get seller data." };
  }
}; 
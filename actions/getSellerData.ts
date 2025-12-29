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
  shopValues?: string[];
  valuesPreferNotToSay?: boolean;
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
        shopValues: true,
        valuesPreferNotToSay: true,
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
    };

    // Remove encrypted fields from the response
    const {
      addresses,
      ...cleanData
    } = decryptedData;

    return { data: cleanData };
  } catch (error) {
    console.error("Error getting seller data:", error);
    return { error: "Failed to get seller data." };
  }
}; 
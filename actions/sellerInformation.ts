"use server";

import * as z from "zod";

import { db } from "@/lib/db";
import { SellerSchema } from "@/schemas/SellerSchema";

import { auth } from "@/auth"; // Adjust to your auth method
import { encryptData } from "@/lib/encryption"; // Make sure this import exists

export const sellerInformation = async (values: z.infer<typeof SellerSchema>) => {
  const validatedFields = SellerSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields." };
  }

  const session = await auth(); // Get the authenticated user session
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  try {
    // Encrypt sensitive data
    const { encrypted: encryptedBusinessName, iv: businessNameIV, salt: businessNameSalt } = 
      await encryptData(validatedFields.data.businessName);
    const { encrypted: encryptedTaxId, iv: taxIdIV, salt: taxIdSalt } = 
      await encryptData(validatedFields.data.taxId);

    // Encrypt address fields
    const { encrypted: encryptedStreet, iv: streetIV, salt: streetSalt } = 
      await encryptData(validatedFields.data.businessAddress);
    const { encrypted: encryptedCity, iv: cityIV, salt: citySalt } = 
      await encryptData(validatedFields.data.businessCity);
    const { encrypted: encryptedPostal, iv: postalIV, salt: postalSalt } = 
      await encryptData(validatedFields.data.businessPostalCode);
    const { encrypted: encryptedCountry, iv: countryIV, salt: countrySalt } = 
      await encryptData(validatedFields.data.taxCountry);

    // Encrypt state if provided
    let stateData = null;
    if (validatedFields.data.businessState) {
      stateData = await encryptData(validatedFields.data.businessState);
    }

    // Prepare data for database
    const dbData = {
      shopName: validatedFields.data.shopName,
      shopDescription: validatedFields.data.shopDescription,
      preferredCurrency: validatedFields.data.preferredCurrency,
      preferredWeightUnit: validatedFields.data.preferredWeightUnit,
      preferredDimensionUnit: validatedFields.data.preferredDimensionUnit,
      preferredDistanceUnit: validatedFields.data.preferredDistanceUnit,
      isWomanOwned: validatedFields.data.isWomanOwned,
      isMinorityOwned: validatedFields.data.isMinorityOwned,
      isLGBTQOwned: validatedFields.data.isLGBTQOwned,
      isVeteranOwned: validatedFields.data.isVeteranOwned,
      isSustainable: validatedFields.data.isSustainable,
      isCharitable: validatedFields.data.isCharitable,
      valuesPreferNotToSay: validatedFields.data.valuesPreferNotToSay,
      taxCountry: validatedFields.data.taxCountry,
      shopNameSlug: validatedFields.data.shopName.toLowerCase().replace(/\s+/g, '-'),
      encryptedBusinessName,
      businessNameIV,
      businessNameSalt,
      encryptedTaxId,
      taxIdIV,
      taxIdSalt,
    };

    // Check if seller exists
    const existingSeller = await db.seller.findUnique({
      where: { userId: session.user.id },
      include: {
        addresses: {
          where: {
            isBusinessAddress: true
          }
        }
      }
    });

    if (existingSeller) {
      // Update existing seller
      await db.seller.update({
        where: { userId: session.user.id },
        data: dbData,
      });

      // Update or create business address
      if (existingSeller.addresses.length > 0) {
        // Update existing business address
        await db.address.update({
          where: { id: existingSeller.addresses[0].id },
          data: {
            encryptedStreet,
            streetIV,
            streetSalt,
            encryptedCity,
            cityIV,
            citySalt,
            encryptedState: stateData?.encrypted,
            stateIV: stateData?.iv,
            stateSalt: stateData?.salt,
            encryptedPostal,
            postalIV,
            postalSalt,
            encryptedCountry,
            countryIV,
            countrySalt,
          }
        });
      } else {
        // Create new business address
        await db.address.create({
          data: {
            encryptedStreet,
            streetIV,
            streetSalt,
            encryptedCity,
            cityIV,
            citySalt,
            encryptedState: stateData?.encrypted,
            stateIV: stateData?.iv,
            stateSalt: stateData?.salt,
            encryptedPostal,
            postalIV,
            postalSalt,
            encryptedCountry,
            countryIV,
            countrySalt,
            isBusinessAddress: true,
            seller: {
              connect: {
                userId: session.user.id
              }
            }
          }
        });
      }
    } else {
      // Create new seller and business address in a transaction
      await db.$transaction(async (tx) => {
        // Create seller
        const seller = await tx.seller.create({
          data: {
            ...dbData,
            user: {
              connect: {
                id: session.user.id
              }
            }
          }
        });

        // Create business address
        await tx.address.create({
          data: {
            encryptedStreet,
            streetIV,
            streetSalt,
            encryptedCity,
            cityIV,
            citySalt,
            encryptedState: stateData?.encrypted,
            stateIV: stateData?.iv,
            stateSalt: stateData?.salt,
            encryptedPostal,
            postalIV,
            postalSalt,
            encryptedCountry,
            countryIV,
            countrySalt,
            isBusinessAddress: true,
            seller: {
              connect: {
                userId: session.user.id
              }
            }
          }
        });
      });
    }

    return { success: "Successfully saved your shop information." };
  } catch (error) {
    console.error("Error saving seller information:", error);
    return { error: "Failed to save seller information." };
  }
};
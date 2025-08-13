"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { Permission } from "@/data/roles-and-permissions";
import { encryptResponsiblePerson, decryptResponsiblePerson } from "@/lib/encryption";
import { revalidatePath } from "next/cache";
import { ResponsiblePersonSchema } from "@/schemas/ResponsiblePersonSchema";

export const createOrUpdateResponsiblePerson = async (values: z.infer<typeof ResponsiblePersonSchema>) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  const canManageSettings = await hasPermission(session.user.id, "MANAGE_SELLER_SETTINGS" as Permission);
  if (!canManageSettings) {
    return { error: "You don't have permission to perform this action." };
  }

  const validatedFields = ResponsiblePersonSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid fields." };
  }

  const { name, email, phone, address, companyName, vatNumber } = validatedFields.data;

  try {
    // Encrypt all responsible person data
    const encryptedData = encryptResponsiblePerson({
      name,
      email,
      phone,
      companyName,
      vatNumber,
      address: {
        street: address.street,
        street2: address.street2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
      },
    });

    // Check if responsible person already exists
    const existingResponsiblePerson = await db.responsiblePerson.findFirst({
      where: { sellerId: session.user.id },
    });

    if (existingResponsiblePerson) {
      // Update existing responsible person
      await db.responsiblePerson.update({
        where: { id: existingResponsiblePerson.id },
        data: {
          // Encrypted personal information with individual IVs and salts
          encryptedName: encryptedData.encryptedName,
          nameIV: encryptedData.nameIV,
          nameSalt: encryptedData.nameSalt,
          encryptedEmail: encryptedData.encryptedEmail,
          emailIV: encryptedData.emailIV,
          emailSalt: encryptedData.emailSalt,
          encryptedPhone: encryptedData.encryptedPhone,
          phoneIV: encryptedData.phoneIV,
          phoneSalt: encryptedData.phoneSalt,
          encryptedCompanyName: encryptedData.encryptedCompanyName,
          companyNameIV: encryptedData.companyNameIV,
          companyNameSalt: encryptedData.companyNameSalt,
          encryptedVatNumber: encryptedData.encryptedVatNumber,
          vatNumberIV: encryptedData.vatNumberIV,
          vatNumberSalt: encryptedData.vatNumberSalt,
          // Encrypted address fields with individual IVs and salts
          encryptedStreet: encryptedData.encryptedStreet,
          streetIV: encryptedData.streetIV,
          streetSalt: encryptedData.streetSalt,
          encryptedStreet2: encryptedData.encryptedStreet2,
          street2IV: encryptedData.street2IV,
          street2Salt: encryptedData.street2Salt,
          encryptedCity: encryptedData.encryptedCity,
          cityIV: encryptedData.cityIV,
          citySalt: encryptedData.citySalt,
          encryptedState: encryptedData.encryptedState,
          stateIV: encryptedData.stateIV,
          stateSalt: encryptedData.stateSalt,
          encryptedPostalCode: encryptedData.encryptedPostalCode,
          postalCodeIV: encryptedData.postalCodeIV,
          postalCodeSalt: encryptedData.postalCodeSalt,
          encryptedCountry: encryptedData.encryptedCountry,
          countryIV: encryptedData.countryIV,
          countrySalt: encryptedData.countrySalt,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new responsible person with individual IVs and salts
      await db.responsiblePerson.create({
        data: {
          sellerId: session.user.id,
          // Encrypted personal information with individual IVs and salts
          encryptedName: encryptedData.encryptedName,
          nameIV: encryptedData.nameIV,
          nameSalt: encryptedData.nameSalt,
          encryptedEmail: encryptedData.encryptedEmail,
          emailIV: encryptedData.emailIV,
          emailSalt: encryptedData.emailSalt,
          encryptedPhone: encryptedData.encryptedPhone,
          phoneIV: encryptedData.phoneIV,
          phoneSalt: encryptedData.phoneSalt,
          encryptedCompanyName: encryptedData.encryptedCompanyName,
          companyNameIV: encryptedData.companyNameIV,
          companyNameSalt: encryptedData.companyNameSalt,
          encryptedVatNumber: encryptedData.encryptedVatNumber,
          vatNumberIV: encryptedData.vatNumberIV,
          vatNumberSalt: encryptedData.vatNumberSalt,
          // Encrypted address fields with individual IVs and salts
          encryptedStreet: encryptedData.encryptedStreet,
          streetIV: encryptedData.streetIV,
          streetSalt: encryptedData.streetSalt,
          encryptedStreet2: encryptedData.encryptedStreet2,
          street2IV: encryptedData.street2IV,
          street2Salt: encryptedData.street2Salt,
          encryptedCity: encryptedData.encryptedCity,
          cityIV: encryptedData.cityIV,
          citySalt: encryptedData.citySalt,
          encryptedState: encryptedData.encryptedState,
          stateIV: encryptedData.stateIV,
          stateSalt: encryptedData.stateSalt,
          encryptedPostalCode: encryptedData.encryptedPostalCode,
          postalCodeIV: encryptedData.postalCodeIV,
          postalCodeSalt: encryptedData.postalCodeSalt,
          encryptedCountry: encryptedData.encryptedCountry,
          countryIV: encryptedData.countryIV,
          countrySalt: encryptedData.countrySalt,
        },
      });
    }

    revalidatePath("/seller/dashboard/settings");
    return { success: "Responsible person information saved successfully!" };
  } catch (error) {
    console.error("Error saving responsible person:", error);
    return { error: "Failed to save responsible person information." };
  }
};

export const getResponsiblePerson = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  try {
    const responsiblePerson = await db.responsiblePerson.findFirst({
      where: { sellerId: session.user.id },
    });

    if (!responsiblePerson) {
      return { data: { hasResponsiblePerson: false } };
    }

    // Decrypt responsible person data with individual IVs and salts
    const decryptedData = decryptResponsiblePerson({
      encryptedName: responsiblePerson.encryptedName,
      nameIV: responsiblePerson.nameIV,
      nameSalt: responsiblePerson.nameSalt,
      encryptedEmail: responsiblePerson.encryptedEmail,
      emailIV: responsiblePerson.emailIV,
      emailSalt: responsiblePerson.emailSalt,
      encryptedPhone: responsiblePerson.encryptedPhone,
      phoneIV: responsiblePerson.phoneIV,
      phoneSalt: responsiblePerson.phoneSalt,
      encryptedCompanyName: responsiblePerson.encryptedCompanyName,
      companyNameIV: responsiblePerson.companyNameIV,
      companyNameSalt: responsiblePerson.companyNameSalt,
      encryptedVatNumber: responsiblePerson.encryptedVatNumber || undefined,
      vatNumberIV: responsiblePerson.vatNumberIV || undefined,
      vatNumberSalt: responsiblePerson.vatNumberSalt || undefined,
      encryptedStreet: responsiblePerson.encryptedStreet,
      streetIV: responsiblePerson.streetIV,
      streetSalt: responsiblePerson.streetSalt,
      encryptedStreet2: responsiblePerson.encryptedStreet2 || undefined,
      street2IV: responsiblePerson.street2IV || undefined,
      street2Salt: responsiblePerson.street2Salt || undefined,
      encryptedCity: responsiblePerson.encryptedCity,
      cityIV: responsiblePerson.cityIV,
      citySalt: responsiblePerson.citySalt,
      encryptedState: responsiblePerson.encryptedState || undefined,
      stateIV: responsiblePerson.stateIV || undefined,
      stateSalt: responsiblePerson.stateSalt || undefined,
      encryptedPostalCode: responsiblePerson.encryptedPostalCode,
      postalCodeIV: responsiblePerson.postalCodeIV,
      postalCodeSalt: responsiblePerson.postalCodeSalt,
      encryptedCountry: responsiblePerson.encryptedCountry,
      countryIV: responsiblePerson.countryIV,
      countrySalt: responsiblePerson.countrySalt,
    });

    return {
      data: {
        hasResponsiblePerson: true,
        responsiblePerson: decryptedData,
      },
    };
  } catch (error) {
    console.error("Error fetching responsible person:", error);
    return { error: "Failed to fetch responsible person information." };
  }
};

export const deleteResponsiblePerson = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  const canManageSettings = await hasPermission(session.user.id, "MANAGE_SELLER_SETTINGS" as Permission);
  if (!canManageSettings) {
    return { error: "You don't have permission to perform this action." };
  }

  try {
    await db.responsiblePerson.deleteMany({
      where: { sellerId: session.user.id },
    });

    revalidatePath("/seller/dashboard/settings");
    return { success: "Responsible person information deleted successfully!" };
  } catch (error) {
    console.error("Error deleting responsible person:", error);
    return { error: "Failed to delete responsible person information." };
  }
};

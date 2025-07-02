"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { CountryExclusionsSchema } from "@/schemas/CountryExclusionsSchema";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { Permission } from "@/data/roles-and-permissions";

export const updateCountryExclusions = async (values: z.infer<typeof CountryExclusionsSchema>) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  const canManageSettings = await hasPermission(session.user.id, "MANAGE_SELLER_SETTINGS" as Permission);
  if (!canManageSettings) {
    return { error: "You don't have permission to perform this action." };
  }

  const validatedFields = CountryExclusionsSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields." };
  }

  const { excludedCountries } = validatedFields.data;

  try {
    // Update seller with excluded countries
    await db.seller.update({
      where: { userId: session.user.id },
      data: {
        excludedCountries,
      },
    });

    return { success: "Country exclusions updated successfully!" };
  } catch (error) {
    console.error("Error updating country exclusions:", error);
    return { error: "Failed to update country exclusions." };
  }
};

export const getCountryExclusions = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  try {
    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: {
        excludedCountries: true,
      },
    });

    if (!seller) {
      return { error: "Seller not found." };
    }

    return { data: seller };
  } catch (error) {
    console.error("Error fetching country exclusions:", error);
    return { error: "Failed to fetch country exclusions." };
  }
}; 
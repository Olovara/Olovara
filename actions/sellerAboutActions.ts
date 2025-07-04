"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { SellerAboutSchema } from "@/schemas/SellerAboutSchema";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { Permission } from "@/data/roles-and-permissions";
import { updateUserSession } from "@/lib/session-update";

export const updateSellerAbout = async (values: z.infer<typeof SellerAboutSchema>) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  const canManageSettings = await hasPermission(session.user.id, "MANAGE_SELLER_SETTINGS" as Permission);
  if (!canManageSettings) {
    return { error: "You don't have permission to perform this action." };
  }

  const validatedFields = SellerAboutSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields." };
  }

  const { shopName, shopTagLine, shopDescription, shopAnnouncement, sellerImage, shopBannerImage, shopLogoImage } = validatedFields.data;

  try {
    // Check if shop name is already taken by another seller
    const existingSeller = await db.seller.findFirst({
      where: {
        shopName: shopName,
        userId: { not: session.user.id }
      }
    });

    if (existingSeller) {
      return { error: "Shop name is already taken." };
    }

    // Generate shop name slug
    const shopNameSlug = shopName
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
      return { error: "Shop name generates a URL that is already taken. Please choose a different name." };
    }

    // Update seller information
    await db.seller.update({
      where: { userId: session.user.id },
      data: {
        shopName,
        shopNameSlug,
        shopTagLine,
        shopDescription,
        shopAnnouncement,
        sellerImage,
        shopBannerImage,
        shopLogoImage,
      },
    });

    // Update session to reflect changes
    await updateUserSession(session.user.id);

    return { success: "Shop information updated successfully." };
  } catch (error) {
    console.error("Error updating seller about:", error);
    return { error: "Something went wrong while updating shop information." };
  }
};

export const getSellerAbout = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  try {
    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: {
        shopName: true,
        shopTagLine: true,
        shopDescription: true,
        shopAnnouncement: true,
        sellerImage: true,
        shopBannerImage: true,
        shopLogoImage: true,
      },
    });

    if (!seller) {
      return { error: "Seller not found." };
    }

    return { data: seller };
  } catch (error) {
    console.error("Error fetching seller about:", error);
    return { error: "Something went wrong while fetching shop information." };
  }
}; 
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { encryptData } from "@/lib/encryption";
import { currentUser } from "@/lib/auth";

export async function updateSellerAbout(data: {
  shopName: string;
  shopTagLine?: string;
  shopDescription: string;
  shopAnnouncement?: string;
  sellerImage?: string;
  shopBannerImage?: string;
  shopLogoImage?: string;
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

    // Update seller profile
    await db.seller.update({
      where: { userId: session.user.id },
      data: {
        shopName: data.shopName,
        shopNameSlug: shopNameSlug,
        shopTagLine: data.shopTagLine,
        shopDescription: data.shopDescription,
        shopAnnouncement: data.shopAnnouncement,
        sellerImage: data.sellerImage,
        shopBannerImage: data.shopBannerImage,
        shopLogoImage: data.shopLogoImage,
      }
    });

    // Note: Session refresh is now handled by the client-side page reload
    // The user's profile has been updated in the database
    console.log("Seller about information updated for user:", session.user.id);

    return { success: true, message: "Shop information updated successfully!" };
  } catch (error) {
    console.error("Error updating seller about:", error);
    return { success: false, error: "Failed to update seller information" };
  }
}

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
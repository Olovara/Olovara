"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

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
        isWomanOwned: true,
        isMinorityOwned: true,
        isLGBTQOwned: true,
        isVeteranOwned: true,
        isSustainable: true,
        isCharitable: true,
        valuesPreferNotToSay: true,
      },
    });

    if (!seller) {
      return { error: "Seller not found." };
    }

    // Convert null values to empty strings for form compatibility
    const formattedSeller = {
      ...seller,
      shopDescription: seller.shopDescription || "",
    };

    return { data: formattedSeller };
  } catch (error) {
    console.error("Error fetching seller data:", error);
    return { error: "Failed to fetch seller data." };
  }
}; 
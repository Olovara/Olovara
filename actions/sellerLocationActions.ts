"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { Permission } from "@/data/roles-and-permissions";
import { EEA_COUNTRIES } from "@/lib/gpsr-compliance";

export const getSellerShopCountry = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  const canManageSettings = await hasPermission(session.user.id, "MANAGE_SELLER_SETTINGS" as Permission);
  if (!canManageSettings) {
    return { error: "You don't have permission to perform this action." };
  }

  try {
    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: {
        shopCountry: true,
      },
    });

    if (!seller) {
      return { error: "Seller not found." };
    }

    const isEUBased = EEA_COUNTRIES.includes(seller.shopCountry);

    return {
      data: {
        shopCountry: seller.shopCountry,
        isEUBased,
      },
    };
  } catch (error) {
    console.error("Error fetching seller shop country:", error);
    return { error: "Failed to fetch seller location." };
  }
};

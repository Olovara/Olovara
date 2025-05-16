import { db } from "@/lib/db";

export async function getSellerPreferences() {
  try {
    const seller = await db.seller.findFirst({
      select: {
        preferredCurrency: true,
        preferredWeightUnit: true,
        preferredDimensionUnit: true,
      },
    });

    if (!seller) {
      return {
        preferredCurrency: "USD",
        preferredWeightUnit: "lbs",
        preferredDimensionUnit: "in",
      };
    }

    return {
      preferredCurrency: seller.preferredCurrency,
      preferredWeightUnit: seller.preferredWeightUnit,
      preferredDimensionUnit: seller.preferredDimensionUnit,
    };
  } catch (error) {
    console.error("Error fetching seller preferences:", error);
    return {
      preferredCurrency: "USD",
      preferredWeightUnit: "lbs",
      preferredDimensionUnit: "in",
    };
  }
} 
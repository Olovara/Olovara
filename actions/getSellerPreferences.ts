import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function getSellerPreferences() {
  try {
    // Get the authenticated user's session
    const session = await auth();
    if (!session?.user?.id) {
      // Return defaults if not authenticated
      return {
        preferredCurrency: "USD",
        preferredWeightUnit: "lbs",
        preferredDimensionUnit: "in",
      };
    }

    // Find the seller record for the current authenticated user
    const seller = await db.seller.findUnique({
      where: {
        userId: session.user.id,
      },
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
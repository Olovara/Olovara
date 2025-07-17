"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { assignFoundingSellerStatus, checkFoundingSellerEligibility } from "@/lib/founding-seller";

/**
 * Create a new product and check for founding seller eligibility
 */
export async function createProduct(productData: any) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    const userId = session.user.id;

    // Check if this is the seller's first product
    const existingProductCount = await db.product.count({
      where: { userId }
    });

    // Create the product
    const product = await db.product.create({
      data: {
        ...productData,
        userId
      }
    });

    // If this is their first product, check for founding seller eligibility
    if (existingProductCount === 0) {
      console.log(`First product created for seller ${userId}, checking founding seller eligibility...`);
      
      const eligibility = await checkFoundingSellerEligibility(userId);
      console.log(`Founding seller eligibility for ${userId}:`, eligibility);

      if (eligibility.eligible) {
        const result = await assignFoundingSellerStatus(userId, new Date());
        if (result.success) {
          console.log(`🎉 Congratulations! Seller ${userId} is now Founding Seller #${result.status?.number}`);
          // You could send a congratulatory email here
        } else {
          console.error(`Failed to assign founding seller status to ${userId}:`, result.error);
        }
      } else {
        console.log(`Seller ${userId} not eligible for founding seller status: ${eligibility.reason}`);
      }
    }

    return { success: true, product };
  } catch (error) {
    console.error("Error creating product:", error);
    return { error: "Failed to create product" };
  }
}

/**
 * Get founding seller status for current user
 */
export async function getCurrentUserFoundingSellerStatus() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    const userId = session.user.id;

    const seller = await db.seller.findUnique({
      where: { userId },
      select: {
        isFoundingSeller: true,
        foundingSellerType: true,
        foundingSellerNumber: true,
        foundingSellerBenefits: true,
        firstProductCreatedAt: true
      }
    });

    if (!seller) {
      return { error: "Seller not found" };
    }

    return {
      success: true,
      status: {
        isFoundingSeller: seller.isFoundingSeller,
        type: seller.foundingSellerType as "LEGACY" | "NEW" | null,
        number: seller.foundingSellerNumber,
        benefits: seller.foundingSellerBenefits,
        firstProductCreatedAt: seller.firstProductCreatedAt
      }
    };
  } catch (error) {
    console.error("Error getting founding seller status:", error);
    return { error: "Failed to get founding seller status" };
  }
}

/**
 * Check if current user is eligible for founding seller status
 */
export async function checkCurrentUserFoundingSellerEligibility() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    const userId = session.user.id;

    const eligibility = await checkFoundingSellerEligibility(userId);

    return {
      success: true,
      eligibility
    };
  } catch (error) {
    console.error("Error checking founding seller eligibility:", error);
    return { error: "Failed to check eligibility" };
  }
} 
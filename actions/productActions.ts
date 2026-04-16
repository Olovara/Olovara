"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import {
  assignFoundingSellerStatus,
  checkFoundingSellerEligibility,
} from "@/lib/founding-seller";
import { generateBatchNumber } from "@/lib/batchNumber";
import { logError } from "@/lib/error-logger";
import { slugifyOrDefault } from "@/lib/slugify";

/**
 * Create a new product and check for founding seller eligibility
 */
export async function createProduct(productData: any) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let userId: string | undefined = undefined;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // Create const for TypeScript type narrowing
    const currentUserId: string = session.user.id;
    userId = currentUserId; // Also assign to outer variable for catch block

    // Check if this is the seller's first product
    const existingProductCount = await db.product.count({
      where: { userId: currentUserId },
    });

    // Create the product
    const product = await db.product.create({
      data: {
        ...productData,
        userId: currentUserId,
        urlSlug: slugifyOrDefault(
          String(productData?.name != null ? productData.name : "product")
        ),
      },
    });

    // Generate batch number for physical products (not digital)
    if (!productData.isDigital) {
      const batchNumber = await generateBatchNumber(product.id);
      await db.product.update({
        where: { id: product.id },
        data: { batchNumber },
      });
    }

    // If this is their first product, check for founding seller eligibility
    if (existingProductCount === 0) {
      console.log(
        `First product created for seller ${currentUserId}, checking founding seller eligibility...`
      );

      const eligibility = await checkFoundingSellerEligibility(currentUserId);
      console.log(
        `Founding seller eligibility for ${currentUserId}:`,
        eligibility
      );

      if (eligibility.eligible) {
        const result = await assignFoundingSellerStatus(
          currentUserId,
          new Date()
        );
        if (result.success) {
          console.log(
            `🎉 Congratulations! Seller ${currentUserId} is now Founding Seller #${result.status?.number}`
          );
          // You could send a congratulatory email here
        } else {
          console.error(
            `Failed to assign founding seller status to ${currentUserId}:`,
            result.error
          );
        }
      } else {
        console.log(
          `Seller ${currentUserId} not eligible for founding seller status: ${eligibility.reason}`
        );
      }
    }

    return { success: true, product };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error creating product:", error);

    // Don't log authentication errors - they're expected
    if (error instanceof Error && error.message.includes("Not authenticated")) {
      return { error: "Not authenticated" };
    }

    // Log to database - user could email about "couldn't create product"
    const userMessage = logError({
      code: "PRODUCT_ACTION_CREATE_FAILED",
      userId,
      route: "actions/productActions",
      method: "createProduct",
      error,
      metadata: {
        productName: productData?.name,
        note: "Failed to create product",
      },
    });

    return { error: userMessage };
  }
}

/**
 * Get founding seller status for current user
 */
export async function getCurrentUserFoundingSellerStatus() {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let userId: string | undefined = undefined;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // Create const for TypeScript type narrowing
    const currentUserId: string = session.user.id;
    userId = currentUserId; // Also assign to outer variable for catch block

    const seller = await db.seller.findUnique({
      where: { userId: currentUserId },
      select: {
        isFoundingSeller: true,
        foundingSellerType: true,
        foundingSellerNumber: true,
        foundingSellerBenefits: true,
        firstProductCreatedAt: true,
      },
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
        firstProductCreatedAt: seller.firstProductCreatedAt,
      },
    };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error getting founding seller status:", error);

    // Don't log authentication errors - they're expected
    if (error instanceof Error && error.message.includes("Not authenticated")) {
      return { error: "Not authenticated" };
    }

    // Log to database - user could email about "can't load founding seller status"
    const userMessage = logError({
      code: "FOUNDING_SELLER_STATUS_FETCH_FAILED",
      userId,
      route: "actions/productActions",
      method: "getCurrentUserFoundingSellerStatus",
      error,
      metadata: {
        note: "Failed to get founding seller status",
      },
    });

    return { error: userMessage };
  }
}

/**
 * Check if current user is eligible for founding seller status
 */
export async function checkCurrentUserFoundingSellerEligibility() {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let userId: string | undefined = undefined;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // Create const for TypeScript type narrowing
    const currentUserId: string = session.user.id;
    userId = currentUserId; // Also assign to outer variable for catch block

    const eligibility = await checkFoundingSellerEligibility(currentUserId);

    return {
      success: true,
      eligibility,
    };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error checking founding seller eligibility:", error);

    // Don't log authentication errors - they're expected
    if (error instanceof Error && error.message.includes("Not authenticated")) {
      return { error: "Not authenticated" };
    }

    // Log to database - user could email about "can't check founding seller eligibility"
    const userMessage = logError({
      code: "FOUNDING_SELLER_ELIGIBILITY_CHECK_FAILED",
      userId,
      route: "actions/productActions",
      method: "checkCurrentUserFoundingSellerEligibility",
      error,
      metadata: {
        note: "Failed to check founding seller eligibility",
      },
    });

    return { error: userMessage };
  }
}

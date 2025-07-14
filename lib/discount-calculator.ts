import { db } from "@/lib/db";

export interface DiscountValidationResult {
  isValid: boolean;
  error?: string;
  discountCode?: {
    id: string;
    code: string;
    name: string;
    description?: string;
    discountType: string;
    discountValue: number;
    minimumOrderAmount?: number;
    maximumDiscountAmount?: number;
    discountAmount: number; // Calculated discount amount in cents
    stackableWithProductSales?: boolean;
  };
}

export interface DiscountCalculation {
  originalAmount: number; // Original amount in cents
  discountAmount: number; // Discount amount in cents
  finalAmount: number; // Final amount after discount in cents
  discountCode: {
    id: string;
    code: string;
    name: string;
    discountType: string;
    discountValue: number;
  };
}

/**
 * Validate a discount code for a specific order
 * @param code - The discount code to validate
 * @param sellerId - The seller ID
 * @param productId - The product ID
 * @param orderAmount - The order amount in cents
 * @param userId - The user ID (optional, for per-customer limits)
 * @returns DiscountValidationResult
 */
export async function validateDiscountCode(
  code: string,
  sellerId: string,
  productId: string,
  orderAmount: number,
  userId?: string
): Promise<DiscountValidationResult> {
  try {
    // Find the discount code
    const discountCode = await db.discountCode.findUnique({
      where: { code: code.toUpperCase() },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        discountType: true,
        discountValue: true,
        minimumOrderAmount: true,
        maximumDiscountAmount: true,
        maxUses: true,
        maxUsesPerCustomer: true,
        currentUses: true,
        expiresAt: true,
        isActive: true,
        sellerId: true,
        appliesToAllProducts: true,
        applicableProductIds: true,
        applicableCategories: true,
        stackableWithProductSales: true,
      },
    });

    if (!discountCode) {
      return { isValid: false, error: "Invalid discount code" };
    }

    // Check if code is active
    if (!discountCode.isActive) {
      return { isValid: false, error: "This discount code is no longer active" };
    }

    // Check if code has expired
    if (discountCode.expiresAt && discountCode.expiresAt < new Date()) {
      return { isValid: false, error: "This discount code has expired" };
    }

    // Check if code belongs to the correct seller
    if (discountCode.sellerId !== sellerId) {
      return { isValid: false, error: "This discount code is not valid for this seller" };
    }

    // Check if code applies to this product
    if (!discountCode.appliesToAllProducts) {
      const isProductApplicable = discountCode.applicableProductIds.includes(productId);
      if (!isProductApplicable) {
        return { isValid: false, error: "This discount code does not apply to this product" };
      }
    }

    // Check minimum order amount
    if (discountCode.minimumOrderAmount && orderAmount < discountCode.minimumOrderAmount) {
      const minAmount = (discountCode.minimumOrderAmount / 100).toFixed(2);
      return { 
        isValid: false, 
        error: `Minimum order amount of $${minAmount} required for this discount code` 
      };
    }

    // Check usage limits
    if (discountCode.maxUses && discountCode.currentUses >= discountCode.maxUses) {
      return { isValid: false, error: "This discount code has reached its usage limit" };
    }

    // Check per-customer usage limits
    if (userId && discountCode.maxUsesPerCustomer) {
      const customerUsageCount = await db.discountCodeUsage.count({
        where: {
          discountCodeId: discountCode.id,
          userId: userId,
        },
      });

      if (customerUsageCount >= discountCode.maxUsesPerCustomer) {
        return { isValid: false, error: "You have already used this discount code the maximum number of times" };
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discountCode.discountType === "PERCENTAGE") {
      discountAmount = Math.round(orderAmount * (discountCode.discountValue / 100));
      
      // Apply maximum discount amount if set
      if (discountCode.maximumDiscountAmount && discountAmount > discountCode.maximumDiscountAmount) {
        discountAmount = discountCode.maximumDiscountAmount;
      }
    } else if (discountCode.discountType === "FIXED_AMOUNT") {
      discountAmount = discountCode.discountValue;
      
      // Ensure discount doesn't exceed order amount
      if (discountAmount > orderAmount) {
        discountAmount = orderAmount;
      }
    }

    return {
      isValid: true,
      discountCode: {
        id: discountCode.id,
        code: discountCode.code,
        name: discountCode.name,
        description: discountCode.description || undefined,
        discountType: discountCode.discountType,
        discountValue: discountCode.discountValue,
        minimumOrderAmount: discountCode.minimumOrderAmount || undefined,
        maximumDiscountAmount: discountCode.maximumDiscountAmount || undefined,
        discountAmount,
        stackableWithProductSales: discountCode.stackableWithProductSales,
      },
    };
  } catch (error) {
    console.error("Error validating discount code:", error);
    return { isValid: false, error: "Error validating discount code" };
  }
}

/**
 * Calculate the final order amount with discount applied
 * @param originalAmount - Original order amount in cents
 * @param discountCode - Validated discount code
 * @returns DiscountCalculation
 */
export function calculateDiscount(
  originalAmount: number,
  discountCode: DiscountValidationResult["discountCode"]
): DiscountCalculation {
  if (!discountCode) {
    throw new Error("No discount code provided");
  }

  const finalAmount = Math.max(0, originalAmount - discountCode.discountAmount);

  return {
    originalAmount,
    discountAmount: discountCode.discountAmount,
    finalAmount,
    discountCode: {
      id: discountCode.id,
      code: discountCode.code,
      name: discountCode.name,
      discountType: discountCode.discountType,
      discountValue: discountCode.discountValue,
    },
  };
}

/**
 * Check if a product is on sale and calculate sale discount
 * @param product - Product object with sale information
 * @returns Sale discount amount in cents or 0 if not on sale
 */
export function calculateProductSaleDiscount(product: {
  price: number;
  discount?: number | null;
  onSale?: boolean;
  saleStartDate?: Date | null;
  saleEndDate?: Date | null;
  saleStartTime?: string | null;
  saleEndTime?: string | null;
}): number {
  if (!product.onSale || !product.discount) {
    return 0;
  }

  // Check if sale is currently active
  const now = new Date();
  
  if (product.saleStartDate) {
    const saleStart = new Date(product.saleStartDate);
    if (product.saleStartTime) {
      const [hours, minutes] = product.saleStartTime.split(':').map(Number);
      saleStart.setHours(hours, minutes, 0, 0);
    }
    if (now < saleStart) {
      return 0; // Sale hasn't started yet
    }
  }

  if (product.saleEndDate) {
    const saleEnd = new Date(product.saleEndDate);
    if (product.saleEndTime) {
      const [hours, minutes] = product.saleEndTime.split(':').map(Number);
      saleEnd.setHours(hours, minutes, 0, 0);
    }
    if (now > saleEnd) {
      return 0; // Sale has ended
    }
  }

  // Calculate sale discount
  return Math.round(product.price * (product.discount / 100));
}

/**
 * Check if discount codes can be stacked with product sales
 * @param discountCode - The discount code to check
 * @param productOnSale - Whether the product is on sale
 * @returns boolean indicating if stacking is allowed
 */
export function canStackDiscountWithSale(
  discountCode: DiscountValidationResult["discountCode"],
  productOnSale: boolean
): boolean {
  if (!productOnSale) {
    return true; // No sale, so stacking is not relevant
  }

  // Check if the discount code allows stacking with product sales
  return discountCode?.stackableWithProductSales ?? true;
} 
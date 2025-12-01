import { db } from "@/lib/db";

export interface FoundingSellerBenefits {
  reducedPlatformFee?: number; // Platform fee percentage (e.g., 8% instead of 10%)
  priorityPlacement?: boolean; // Priority placement in search results for 1 year
  prioritySupport?: boolean; // Priority customer support
  earlyAccessFeatures?: boolean; // Early access to new features
  featuredInMarketing?: boolean; // Listing showcased in blogs, emails, social, etc.
  customBadge?: string; // Custom badge displayed on their shop
  lifetimeBenefits?: boolean; // These benefits are lifetime
  [key: string]: any; // Allow for additional custom benefits
}

export interface FoundingSellerStatus {
  isFoundingSeller: boolean;
  type: "LEGACY" | "NEW" | null;
  number: number | null;
  benefits: FoundingSellerBenefits | null;
  firstProductCreatedAt: Date | null;
}

/**
 * Default benefits for founding sellers (both new and legacy)
 */
export const FOUNDING_SELLER_BENEFITS: FoundingSellerBenefits = {
  reducedPlatformFee: 8, // 8% instead of 10% (20% reduction)
  priorityPlacement: true, // Priority placement in search results for 1 year
  prioritySupport: true, // Priority customer support
  earlyAccessFeatures: true, // Early access to new features
  featuredInMarketing: true, // Listing showcased in blogs, emails, social, etc.
  customBadge: "Founding Seller", // Exclusive "Founding Seller" badge
  lifetimeBenefits: true, // These benefits are lifetime
};

/**
 * Check if a seller is eligible for founding seller status
 * Only counts sellers who have created at least one product
 */
export async function checkFoundingSellerEligibility(sellerId: string): Promise<{
  eligible: boolean;
  reason?: string;
  currentCount: number;
}> {
  try {
    // Check if seller has created any products
    const productCount = await db.product.count({
      where: { userId: sellerId }
    });

    if (productCount === 0) {
      return {
        eligible: false,
        reason: "No products created yet",
        currentCount: 0
      };
    }

    // Count how many sellers have already qualified as founding sellers
    const foundingSellerCount = await db.seller.count({
      where: {
        isFoundingSeller: true,
        foundingSellerType: "NEW"
      }
    });

    const eligible = foundingSellerCount < 50;
    
    return {
      eligible,
      reason: eligible ? "Eligible" : "Maximum founding sellers reached (50)",
      currentCount: foundingSellerCount
    };
  } catch (error) {
    console.error("Error checking founding seller eligibility:", error);
    return {
      eligible: false,
      reason: "Error checking eligibility",
      currentCount: 0
    };
  }
}

/**
 * Assign founding seller status to a seller
 * This should be called when they create their first product
 */
export async function assignFoundingSellerStatus(
  sellerId: string, 
  firstProductCreatedAt: Date
): Promise<{
  success: boolean;
  status?: FoundingSellerStatus;
  error?: string;
}> {
  try {
    // Check eligibility
    const eligibility = await checkFoundingSellerEligibility(sellerId);
    
    if (!eligibility.eligible) {
      return {
        success: false,
        error: eligibility.reason
      };
    }

    // Get the next founding seller number
    const nextNumber = eligibility.currentCount + 1;

    // Update the seller with founding seller status
    const updatedSeller = await db.seller.update({
      where: { userId: sellerId },
      data: {
        isFoundingSeller: true,
        foundingSellerType: "NEW",
        foundingSellerNumber: nextNumber,
        firstProductCreatedAt,
        foundingSellerBenefits: FOUNDING_SELLER_BENEFITS
      }
    });

    const status: FoundingSellerStatus = {
      isFoundingSeller: true,
      type: "NEW",
      number: nextNumber,
      benefits: FOUNDING_SELLER_BENEFITS,
      firstProductCreatedAt
    };

    console.log(`Assigned founding seller status to seller ${sellerId} as #${nextNumber}`);

    return {
      success: true,
      status
    };
  } catch (error) {
    console.error("Error assigning founding seller status:", error);
    return {
      success: false,
      error: "Failed to assign founding seller status"
    };
  }
}

/**
 * Assign legacy founding seller status to existing sellers
 * This should be called manually for existing sellers you want to include
 */
export async function assignLegacyFoundingSellerStatus(
  sellerId: string
): Promise<{
  success: boolean;
  status?: FoundingSellerStatus;
  error?: string;
}> {
  try {
    // Check if seller already has founding seller status
    const existingSeller = await db.seller.findUnique({
      where: { userId: sellerId },
      select: { isFoundingSeller: true, foundingSellerType: true }
    });

    if (existingSeller?.isFoundingSeller) {
      return {
        success: false,
        error: "Seller already has founding seller status"
      };
    }

    // Update the seller with legacy founding seller status
    const updatedSeller = await db.seller.update({
      where: { userId: sellerId },
      data: {
        isFoundingSeller: true,
        foundingSellerType: "LEGACY",
        foundingSellerNumber: null, // Legacy sellers don't get a number
        foundingSellerBenefits: FOUNDING_SELLER_BENEFITS
      }
    });

    const status: FoundingSellerStatus = {
      isFoundingSeller: true,
      type: "LEGACY",
      number: null,
      benefits: FOUNDING_SELLER_BENEFITS,
      firstProductCreatedAt: null
    };

    console.log(`Assigned legacy founding seller status to seller ${sellerId}`);

    return {
      success: true,
      status
    };
  } catch (error) {
    console.error("Error assigning legacy founding seller status:", error);
    return {
      success: false,
      error: "Failed to assign legacy founding seller status"
    };
  }
}

/**
 * Get founding seller status for a seller
 */
export async function getFoundingSellerStatus(sellerId: string): Promise<FoundingSellerStatus | null> {
  try {
    const seller = await db.seller.findUnique({
      where: { userId: sellerId },
      select: {
        isFoundingSeller: true,
        foundingSellerType: true,
        foundingSellerNumber: true,
        foundingSellerBenefits: true,
        firstProductCreatedAt: true
      }
    });

    if (!seller || !seller.isFoundingSeller) {
      return null;
    }

    return {
      isFoundingSeller: seller.isFoundingSeller,
      type: seller.foundingSellerType as "LEGACY" | "NEW" | null,
      number: seller.foundingSellerNumber,
      benefits: seller.foundingSellerBenefits as FoundingSellerBenefits,
      firstProductCreatedAt: seller.firstProductCreatedAt
    };
  } catch (error) {
    console.error("Error getting founding seller status:", error);
    return null;
  }
}

/**
 * Get all founding sellers
 */
export async function getAllFoundingSellers(): Promise<{
  newFoundingSellers: Array<{ userId: string; number: number; firstProductCreatedAt: Date }>;
  legacyFoundingSellers: Array<{ userId: string }>;
  totalCount: number;
}> {
  try {
    const [newSellers, legacySellers] = await Promise.all([
      db.seller.findMany({
        where: {
          isFoundingSeller: true,
          foundingSellerType: "NEW"
        },
        select: {
          userId: true,
          foundingSellerNumber: true,
          firstProductCreatedAt: true
        },
        orderBy: { foundingSellerNumber: 'asc' }
      }),
      db.seller.findMany({
        where: {
          isFoundingSeller: true,
          foundingSellerType: "LEGACY"
        },
        select: {
          userId: true
        }
      })
    ]);

    return {
      newFoundingSellers: newSellers.map(seller => ({
        userId: seller.userId,
        number: seller.foundingSellerNumber!,
        firstProductCreatedAt: seller.firstProductCreatedAt!
      })),
      legacyFoundingSellers: legacySellers.map(seller => ({
        userId: seller.userId
      })),
      totalCount: newSellers.length + legacySellers.length
    };
  } catch (error) {
    console.error("Error getting all founding sellers:", error);
    return {
      newFoundingSellers: [],
      legacyFoundingSellers: [],
      totalCount: 0
    };
  }
}

/**
 * Check if founding seller program is still open
 */
export async function isFoundingSellerProgramOpen(): Promise<boolean> {
  try {
    const newFoundingSellerCount = await db.seller.count({
      where: {
        isFoundingSeller: true,
        foundingSellerType: "NEW"
      }
    });

    return newFoundingSellerCount < 50;
  } catch (error) {
    console.error("Error checking founding seller program status:", error);
    return false;
  }
}

/**
 * Check if a new seller signup is eligible for founding seller status
 * This is used during the seller application process (before products are created)
 */
export async function checkFoundingSellerEligibilityAtSignup(): Promise<{
  eligible: boolean;
  currentCount: number;
  nextNumber: number | null;
}> {
  try {
    // Count how many "NEW" founding sellers already exist
    const newFoundingSellerCount = await db.seller.count({
      where: {
        isFoundingSeller: true,
        foundingSellerType: "NEW"
      }
    });

    const eligible = newFoundingSellerCount < 50;
    const nextNumber = eligible ? newFoundingSellerCount + 1 : null;

    return {
      eligible,
      currentCount: newFoundingSellerCount,
      nextNumber
    };
  } catch (error) {
    console.error("Error checking founding seller eligibility at signup:", error);
    return {
      eligible: false,
      currentCount: 0,
      nextNumber: null
    };
  }
}

/**
 * Assign founding seller status during seller signup
 * This should be called when a seller submits their application
 */
export async function assignFoundingSellerStatusAtSignup(
  sellerId: string
): Promise<{
  success: boolean;
  isFoundingSeller: boolean;
  foundingSellerType: "NEW" | "LEGACY" | null;
  foundingSellerNumber: number | null;
  error?: string;
}> {
  try {
    // Check eligibility
    const eligibility = await checkFoundingSellerEligibilityAtSignup();

    if (!eligibility.eligible) {
      // Program is full, don't assign founding seller status
      return {
        success: true,
        isFoundingSeller: false,
        foundingSellerType: null,
        foundingSellerNumber: null
      };
    }

    // Update the seller with founding seller status
    await db.seller.update({
      where: { userId: sellerId },
      data: {
        isFoundingSeller: true,
        foundingSellerType: "NEW",
        foundingSellerNumber: eligibility.nextNumber!,
        foundingSellerBenefits: FOUNDING_SELLER_BENEFITS
      }
    });

    console.log(`Assigned founding seller status to seller ${sellerId} as #${eligibility.nextNumber} during signup`);

    return {
      success: true,
      isFoundingSeller: true,
      foundingSellerType: "NEW",
      foundingSellerNumber: eligibility.nextNumber!
    };
  } catch (error) {
    console.error("Error assigning founding seller status at signup:", error);
    return {
      success: false,
      isFoundingSeller: false,
      foundingSellerType: null,
      foundingSellerNumber: null,
      error: "Failed to assign founding seller status"
    };
  }
} 
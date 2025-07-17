"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { 
  assignLegacyFoundingSellerStatus, 
  getAllFoundingSellers, 
  isFoundingSellerProgramOpen 
} from "@/lib/founding-seller";
import { currentUserWithPermissions } from "@/lib/auth";

/**
 * Assign legacy founding seller status to an existing seller
 * This is for existing sellers who should get founding seller benefits
 */
export async function assignLegacyFoundingSeller(sellerId: string) {
  try {
    const currentUserData = await currentUserWithPermissions();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has admin permissions
    const hasAdminPermission = currentUserData.permissions?.includes('MANAGE_FOUNDING_SELLERS');
    
    if (!hasAdminPermission) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    const result = await assignLegacyFoundingSellerStatus(sellerId);

    if (result.success) {
      console.log(`Admin ${currentUserData.id} assigned legacy founding seller status to ${sellerId}`);
    }

    return result;
  } catch (error) {
    console.error("Error assigning legacy founding seller status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to assign legacy founding seller status"
    };
  }
}

/**
 * Get all founding sellers for admin dashboard
 */
export async function getFoundingSellersForAdmin() {
  try {
    const currentUserData = await currentUserWithPermissions();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has admin permissions
    const hasAdminPermission = currentUserData.permissions?.includes('VIEW_FOUNDING_SELLERS');
    
    if (!hasAdminPermission) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    const foundingSellers = await getAllFoundingSellers();

    // Get additional details for each seller
    const newSellersWithDetails = await Promise.all(
      foundingSellers.newFoundingSellers.map(async (seller) => {
        const sellerDetails = await db.seller.findUnique({
          where: { userId: seller.userId },
          select: {
            shopName: true,
            user: {
              select: {
                email: true,
                username: true
              }
            }
          }
        });

        return {
          ...seller,
          shopName: sellerDetails?.shopName,
          email: sellerDetails?.user?.email,
          username: sellerDetails?.user?.username
        };
      })
    );

    const legacySellersWithDetails = await Promise.all(
      foundingSellers.legacyFoundingSellers.map(async (seller) => {
        const sellerDetails = await db.seller.findUnique({
          where: { userId: seller.userId },
          select: {
            shopName: true,
            user: {
              select: {
                email: true,
                username: true
              }
            }
          }
        });

        return {
          ...seller,
          shopName: sellerDetails?.shopName,
          email: sellerDetails?.user?.email,
          username: sellerDetails?.user?.username
        };
      })
    );

    return {
      success: true,
      newFoundingSellers: newSellersWithDetails,
      legacyFoundingSellers: legacySellersWithDetails,
      totalCount: foundingSellers.totalCount,
      programOpen: await isFoundingSellerProgramOpen()
    };
  } catch (error) {
    console.error("Error getting founding sellers for admin:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get founding sellers"
    };
  }
}

/**
 * Get all sellers who could potentially be assigned legacy founding seller status
 */
export async function getPotentialLegacyFoundingSellers() {
  try {
    const currentUserData = await currentUserWithPermissions();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has admin permissions
    const hasAdminPermission = currentUserData.permissions?.includes('VIEW_FOUNDING_SELLERS');
    
    if (!hasAdminPermission) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    // Get all sellers who are not already founding sellers
    const potentialSellers = await db.seller.findMany({
      where: {
        isFoundingSeller: false,
        applicationAccepted: true // Only consider approved sellers
      },
      select: {
        userId: true,
        shopName: true,
        createdAt: true,
        totalProducts: true,
        totalSales: true,
        user: {
          select: {
            email: true,
            username: true
          }
        }
      },
      orderBy: { createdAt: 'asc' } // Oldest first
    });

    return {
      success: true,
      potentialSellers
    };
  } catch (error) {
    console.error("Error getting potential legacy founding sellers:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get potential legacy founding sellers"
    };
  }
}

/**
 * Get founding seller program statistics
 */
export async function getFoundingSellerStats() {
  try {
    const currentUserData = await currentUserWithPermissions();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has admin permissions
    const hasAdminPermission = currentUserData.permissions?.includes('VIEW_FOUNDING_SELLERS');
    
    if (!hasAdminPermission) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    const [newCount, legacyCount, totalSellers] = await Promise.all([
      db.seller.count({
        where: {
          isFoundingSeller: true,
          foundingSellerType: "NEW"
        }
      }),
      db.seller.count({
        where: {
          isFoundingSeller: true,
          foundingSellerType: "LEGACY"
        }
      }),
      db.seller.count({
        where: {
          applicationAccepted: true
        }
      })
    ]);

    const programOpen = newCount < 50;
    const spotsRemaining = 50 - newCount;

    return {
      success: true,
      stats: {
        newFoundingSellers: newCount,
        legacyFoundingSellers: legacyCount,
        totalFoundingSellers: newCount + legacyCount,
        totalSellers,
        programOpen,
        spotsRemaining: Math.max(0, spotsRemaining),
        maxNewFoundingSellers: 50
      }
    };
  } catch (error) {
    console.error("Error getting founding seller stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get founding seller stats"
    };
  }
} 
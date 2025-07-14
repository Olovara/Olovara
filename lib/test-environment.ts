import { db } from "@/lib/db";

/**
 * Check if a user can access test environment
 * @param userId - The user ID to check
 * @returns Promise<boolean> - Whether user can access test environment
 */
export async function canUserAccessTestEnvironment(userId: string): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { 
        canAccessTestEnvironment: true,
        role: true,
        admin: {
          select: { role: true }
        }
      }
    });

    if (!user) return false;

    // Admins always have access
    if (user.role === "SUPER_ADMIN" || user.admin?.role) {
      return true;
    }

    // Check if user has explicit test environment access
    return user.canAccessTestEnvironment;
  } catch (error) {
    console.error("Error checking test environment access:", error);
    return false;
  }
}

/**
 * Grant test environment access to a user
 * @param userId - The user ID to grant access to
 * @param grantedBy - The admin ID who is granting access
 * @returns Promise<boolean> - Whether access was granted successfully
 */
export async function grantTestEnvironmentAccess(
  userId: string, 
  grantedBy: string
): Promise<boolean> {
  try {
    await db.user.update({
      where: { id: userId },
      data: {
        canAccessTestEnvironment: true,
        testEnvironmentAccessGrantedAt: new Date(),
        testEnvironmentAccessGrantedBy: grantedBy,
      },
    });
    return true;
  } catch (error) {
    console.error("Error granting test environment access:", error);
    return false;
  }
}

/**
 * Revoke test environment access from a user
 * @param userId - The user ID to revoke access from
 * @returns Promise<boolean> - Whether access was revoked successfully
 */
export async function revokeTestEnvironmentAccess(userId: string): Promise<boolean> {
  try {
    await db.user.update({
      where: { id: userId },
      data: {
        canAccessTestEnvironment: false,
        testEnvironmentAccessGrantedAt: null,
        testEnvironmentAccessGrantedBy: null,
      },
    });
    return true;
  } catch (error) {
    console.error("Error revoking test environment access:", error);
    return false;
  }
}

/**
 * Filter products based on user's test environment access
 * @param products - Array of products to filter
 * @param canAccessTest - Whether user can access test environment
 * @returns Filtered array of products
 */
export function filterProductsByTestAccess<T extends { isTestProduct?: boolean }>(
  products: T[],
  canAccessTest: boolean
): T[] {
  if (canAccessTest) {
    // Test users can see all products (test and non-test)
    return products;
  } else {
    // Regular users can only see non-test products
    return products.filter(product => !product.isTestProduct);
  }
}

/**
 * Check if a product should be visible to a user
 * @param product - The product to check
 * @param canAccessTest - Whether user can access test environment
 * @returns boolean - Whether product should be visible
 */
export function isProductVisibleToUser<T extends { isTestProduct?: boolean }>(
  product: T,
  canAccessTest: boolean
): boolean {
  if (product.isTestProduct) {
    return canAccessTest;
  }
  return true; // Non-test products are always visible
} 
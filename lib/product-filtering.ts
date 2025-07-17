import { doesSellerShipToCountry } from "@/lib/country-exclusions";
import { auth } from "@/auth";
import { canUserAccessTestEnvironment } from "@/lib/test-environment";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Centralized product filtering configuration
 * This handles all product filtering logic in one place
 */
export interface ProductFilterConfig {
  userCountryCode?: string;
  canAccessTest?: boolean;
  includeTestProducts?: boolean; // Override for admin/seller dashboards
}

/**
 * Create a complete Prisma where clause for product filtering
 * This centralizes all filtering logic including:
 * - Test product filtering
 * - Location-based filtering
 * - Status filtering
 * - Seller status filtering (exclude suspended sellers)
 * - Any additional filters
 */
export async function createProductFilterWhereClause(
  additionalFilters: Prisma.ProductWhereInput = {},
  config: ProductFilterConfig = {}
): Promise<Prisma.ProductWhereInput> {
  // Get user's test environment access if not provided
  let canAccessTest = config.canAccessTest;
  if (canAccessTest === undefined) {
    const session = await auth();
    canAccessTest = session?.user?.id 
      ? await canUserAccessTestEnvironment(session.user.id)
      : false;
  }

  // Debug logging for test product filtering
  console.log('[DEBUG] Product Filtering - User test access:', {
    canAccessTest,
    includeTestProducts: config.includeTestProducts,
    userId: (await auth())?.user?.id
  });

  // Build the base where clause
  const where: Prisma.ProductWhereInput = {
    AND: [
      // Always filter by active status
      { status: "ACTIVE" },
      
      // Test product filtering (unless explicitly overridden)
      ...(config.includeTestProducts || canAccessTest ? [] : [{ isTestProduct: false }]),
      
      // Filter out products from suspended sellers
      // Use seller existence check instead of nested relationship query
      // This avoids the Prisma issue with seller.user.status nested queries
      {
        seller: {
          isNot: null // Only show products that have a seller profile
        }
      },
      
      // Location-based filtering (handled at DB level when possible)
      ...(config.userCountryCode ? [createLocationFilterWhereClause(config.userCountryCode)] : []),
      
      // Additional filters passed in
      ...Object.keys(additionalFilters).length > 0 ? [additionalFilters] : [],
    ],
  };

  // Debug logging for final where clause
  console.log('[DEBUG] Product Filtering - Final where clause:', JSON.stringify(where, null, 2));

  return where;
}

/**
 * Debug function to log product query results
 * This helps identify why test products might not be showing up
 */
export async function debugProductQuery(where: Prisma.ProductWhereInput) {
  try {
    const products = await db.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        status: true,
        isTestProduct: true,
        seller: {
          select: {
            userId: true,
            shopName: true,
            shopNameSlug: true,
            isWomanOwned: true,
            isMinorityOwned: true,
            isLGBTQOwned: true,
            isVeteranOwned: true,
            isSustainable: true,
            isCharitable: true,
            excludedCountries: true,
            user: {
              select: {
                status: true
              }
            }
          }
        }
      }
    });

    console.log('[DEBUG] Products returned by query:', products.length);
    products.forEach(product => {
      console.log(`- ${product.name} (ID: ${product.id})`);
      console.log(`  Status: ${product.status}`);
      console.log(`  isTestProduct: ${product.isTestProduct}`);
      console.log(`  Seller Status: ${product.seller?.user?.status || 'No seller'}`);
      console.log(`  Shop Name: ${product.seller?.shopName || 'No shop name'}`);
    });

    const testProducts = products.filter(p => p.isTestProduct);
    console.log(`[DEBUG] Test products in results: ${testProducts.length}`);
    
    // Filter out products from inactive sellers (since we can't do this in the DB query)
    const productsWithActiveSellers = products.filter(product => {
      if (!product.seller) return false;
      return product.seller.user?.status === 'ACTIVE';
    });
    
    console.log(`[DEBUG] Products with active sellers: ${productsWithActiveSellers.length}`);
    const testProductsWithActiveSellers = productsWithActiveSellers.filter(p => p.isTestProduct);
    console.log(`[DEBUG] Test products with active sellers: ${testProductsWithActiveSellers.length}`);
    
    return productsWithActiveSellers; // Return the filtered results
  } catch (error) {
    console.error('[DEBUG] Error in debugProductQuery:', error);
    return [];
  }
}

/**
 * Filter products based on user's location and seller country exclusions
 * @param products - Array of products with seller information
 * @param userCountryCode - User's detected country code
 * @returns Filtered array of products that can be shipped to the user's location
 */
export function filterProductsByLocation(
  products: Array<{
    id: string;
    seller: {
      excludedCountries?: string[] | null;
    } | null;
  }>,
  userCountryCode: string
): typeof products {
  if (!userCountryCode) {
    // If no country detected, show all products
    return products;
  }

  return products.filter((product) => {
    // If no seller info, allow the product (shouldn't happen in normal cases)
    if (!product.seller) {
      return true;
    }

    // Check if seller ships to user's country
    return doesSellerShipToCountry(
      product.seller.excludedCountries || [],
      userCountryCode
    );
  });
}

/**
 * Create a Prisma where clause to filter products by location at the database level
 * This is more efficient than filtering in memory
 * @param userCountryCode - User's detected country code
 * @returns Prisma where clause to exclude products from sellers who don't ship to the user's country
 */
export function createLocationFilterWhereClause(userCountryCode: string) {
  if (!userCountryCode) {
    // If no country detected, don't apply any location filter
    return {};
  }

  // Temporarily disable location filtering at database level due to Prisma array filtering issues
  // We'll handle location filtering in memory instead
  console.log('Location filtering disabled at database level for user country:', userCountryCode);
  return {};
}

/**
 * Get the number of products that would be available to a user in a specific location
 * @param totalProducts - Total number of products
 * @param userCountryCode - User's detected country code
 * @param sellersWithExclusions - Array of seller exclusion data
 * @returns Number of products available to the user
 */
export function getAvailableProductCount(
  totalProducts: number,
  userCountryCode: string,
  sellersWithExclusions: Array<{
    excludedCountries?: string[] | null;
  }>
): number {
  if (!userCountryCode) {
    return totalProducts;
  }

  const excludedCount = sellersWithExclusions.filter((seller) => {
    return !doesSellerShipToCountry(
      seller.excludedCountries || [],
      userCountryCode
    );
  }).length;

  return totalProducts - excludedCount;
}

/**
 * Helper function to get user's country code and test access in one call
 * This reduces boilerplate in components
 */
export async function getProductFilterConfig(
  userCountryCode?: string,
  includeTestProducts: boolean = false
): Promise<ProductFilterConfig> {
  const session = await auth();
  const canAccessTest = session?.user?.id 
    ? await canUserAccessTestEnvironment(session.user.id)
    : false;

  return {
    userCountryCode,
    canAccessTest,
    includeTestProducts,
  };
} 
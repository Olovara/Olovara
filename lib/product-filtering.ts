import { doesSellerShipToCountry } from "@/lib/country-exclusions";

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
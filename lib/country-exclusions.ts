import { getCountryByCode } from "@/data/countries";

/**
 * Check if a country is excluded by a seller
 * @param sellerExcludedCountries - Array of country codes that the seller excludes
 * @param targetCountryCode - The country code to check
 * @returns boolean - true if the country is excluded, false otherwise
 */
export const isCountryExcluded = (
  sellerExcludedCountries: string[],
  targetCountryCode: string
): boolean => {
  if (!sellerExcludedCountries || sellerExcludedCountries.length === 0) {
    return false;
  }
  
  return sellerExcludedCountries.includes(targetCountryCode);
};

/**
 * Get a list of excluded country names from country codes
 * @param excludedCountryCodes - Array of country codes
 * @returns Array of country names
 */
export const getExcludedCountryNames = (excludedCountryCodes: string[]): string[] => {
  if (!excludedCountryCodes || excludedCountryCodes.length === 0) {
    return [];
  }
  
  return excludedCountryCodes
    .map(code => getCountryByCode(code)?.name || code)
    .filter(Boolean);
};

/**
 * Check if a seller ships to a specific country
 * @param sellerExcludedCountries - Array of country codes that the seller excludes
 * @param targetCountryCode - The country code to check
 * @returns boolean - true if the seller ships to this country, false otherwise
 */
export const doesSellerShipToCountry = (
  sellerExcludedCountries: string[],
  targetCountryCode: string
): boolean => {
  return !isCountryExcluded(sellerExcludedCountries, targetCountryCode);
}; 
import { getCountryByCode } from "@/data/countries";
import { SHIPPING_ZONES } from "@/data/shipping";

export interface CountryRate {
  countryCode: string;
  price: number;
  currency: string;
}

export interface ShippingCalculation {
  zone: string;
  isInternational: boolean;
  price: number;
  currency: string;
  estimatedDays: number;
  additionalItem?: number | null;
  serviceLevel?: string | null;
  isFreeShipping: boolean;
  countryRates?: CountryRate[]; // Array of country-specific rates
}

/**
 * Determine the shipping zone for a destination country relative to origin country
 * @param originCountry - The seller's country (origin)
 * @param destinationCountry - The buyer's country (destination)
 * @returns The shipping zone and whether it's international
 */
export function determineShippingZone(
  originCountry: string,
  destinationCountry: string
): { zone: string; isInternational: boolean } {
  // If same country, it's domestic
  if (originCountry === destinationCountry) {
    // Get the country data to determine the correct zone
    const countryData = getCountryByCode(originCountry);
    const zone = countryData?.zone || "NORTH_AMERICA";
    return { zone, isInternational: false };
  }

  // Get country data
  const originCountryData = getCountryByCode(originCountry);
  const destinationCountryData = getCountryByCode(destinationCountry);

  if (!originCountryData || !destinationCountryData) {
    // Fallback to international if country data not found
    return { zone: "REST_OF_WORLD", isInternational: true };
  }

  // Different countries = international shipping (even within same zone)
  // This is the key fix: GB to DE should be international, not domestic
  return {
    zone: destinationCountryData.zone,
    isInternational: true,
  };
}

/**
 * Calculate shipping cost based on seller's shipping profile and buyer's address
 * @param shippingRates - Array of shipping rates from seller's profile
 * @param originCountry - Seller's country
 * @param destinationCountry - Buyer's country
 * @param quantity - Number of items (for additional item calculations)
 * @returns Shipping calculation or null if no matching rate found
 */
export function calculateShippingCost(
  shippingRates: ShippingCalculation[],
  originCountry: string,
  destinationCountry: string,
  quantity: number = 1
): ShippingCalculation | null {
  // Determine the appropriate zone and international status
  const { zone, isInternational } = determineShippingZone(
    originCountry,
    destinationCountry
  );

  // Find the zone rate
  const zoneRate = shippingRates.find(
    (rate) => rate.zone === zone && rate.isInternational === isInternational
  );

  if (!zoneRate) {
    return null;
  }

  // Check if there's a country-specific rate for this destination
  let finalPrice = zoneRate.price;
  let finalCurrency = zoneRate.currency;

  if (zoneRate.countryRates && zoneRate.countryRates.length > 0) {
    const countryRate = zoneRate.countryRates.find(
      (countryRate) => countryRate.countryCode === destinationCountry
    );

    if (countryRate) {
      // Use country-specific rate
      finalPrice = countryRate.price;
      finalCurrency = countryRate.currency;
    }
    // If no country-specific rate found, use zone rate (already set above)
  }

  // Calculate total shipping cost including additional items
  const additionalItemCost =
    zoneRate.additionalItem && quantity > 1
      ? zoneRate.additionalItem * (quantity - 1)
      : 0;

  const totalPrice = finalPrice + additionalItemCost;

  return {
    ...zoneRate,
    price: totalPrice,
    currency: finalCurrency,
  };
}

/**
 * Get the best shipping rate for a destination
 * @param shippingRates - Array of shipping rates
 * @param originCountry - Seller's country
 * @param destinationCountry - Buyer's country
 * @returns Best shipping rate or null
 */
export function getBestShippingRate(
  shippingRates: ShippingCalculation[],
  originCountry: string,
  destinationCountry: string
): ShippingCalculation | null {
  const { zone, isInternational } = determineShippingZone(
    originCountry,
    destinationCountry
  );

  // Find the zone rate
  let rate = shippingRates.find(
    (r) => r.zone === zone && r.isInternational === isInternational
  );

  // If no exact match, try to find any rate for the zone
  if (!rate) {
    rate = shippingRates.find((r) => r.zone === zone);
  }

  // If still no match, try to find any international rate
  if (!rate && isInternational) {
    rate = shippingRates.find((r) => r.isInternational);
  }

  // Last resort: find any rate
  if (!rate) {
    rate = shippingRates[0];
  }

  return rate || null;
}

/**
 * Validate if a shipping rate exists for a destination
 * @param shippingRates - Array of shipping rates
 * @param originCountry - Seller's country
 * @param destinationCountry - Buyer's country
 * @returns boolean indicating if shipping is available
 */
export function isShippingAvailable(
  shippingRates: ShippingCalculation[],
  originCountry: string,
  destinationCountry: string
): boolean {
  return (
    getBestShippingRate(shippingRates, originCountry, destinationCountry) !==
    null
  );
}

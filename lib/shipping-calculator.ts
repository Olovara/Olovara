import { getCountryByCode } from "@/data/countries";
import { SHIPPING_ZONES } from "@/data/shipping";

export interface ShippingCalculation {
  zone: string;
  isInternational: boolean;
  price: number;
  currency: string;
  estimatedDays: number;
  additionalItem?: number | null;
  serviceLevel?: string | null;
  isFreeShipping: boolean;
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
    isInternational: true 
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
  const { zone, isInternational } = determineShippingZone(originCountry, destinationCountry);

  // Find matching shipping rate
  const matchingRate = shippingRates.find(rate => 
    rate.zone === zone && rate.isInternational === isInternational
  );

  if (!matchingRate) {
    return null;
  }

  // Calculate total shipping cost including additional items
  const basePrice = matchingRate.price;
  const additionalItemCost = matchingRate.additionalItem && quantity > 1 
    ? matchingRate.additionalItem * (quantity - 1) 
    : 0;
  
  const totalPrice = basePrice + additionalItemCost;

  return {
    ...matchingRate,
    price: totalPrice,
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
  const { zone, isInternational } = determineShippingZone(originCountry, destinationCountry);

  // First try to find exact match
  let rate = shippingRates.find(r => 
    r.zone === zone && r.isInternational === isInternational
  );

  // If no exact match, try to find any rate for the zone
  if (!rate) {
    rate = shippingRates.find(r => r.zone === zone);
  }

  // If still no match, try to find any international rate
  if (!rate && isInternational) {
    rate = shippingRates.find(r => r.isInternational);
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
  return getBestShippingRate(shippingRates, originCountry, destinationCountry) !== null;
} 
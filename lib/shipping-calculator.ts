import { getCountryByCode } from "@/data/countries";
import { SHIPPING_ZONES } from "@/data/shipping";

export interface ShippingCalculation {
  zone: string;
  price: number;
  currency?: string; // Optional - defaults to USD or shipping option currency
  additionalItem?: number | null;
  serviceLevel?: string | null;
  isFreeShipping: boolean;
  type?: "zone" | "country";
  countryCode?: string;
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
    // Use the destination country's zone if available, otherwise default to first zone
    return {
      zone: destinationCountryData?.zone || "NORTH_AMERICA",
      isInternational: true,
    };
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
 * @param defaultShipping - Default worldwide shipping cost in cents (optional)
 * @param defaultShippingCurrency - Currency for default shipping (optional)
 * @returns Shipping calculation or null if no matching rate found and no default shipping
 */
export function calculateShippingCost(
  shippingRates: ShippingCalculation[],
  originCountry: string,
  destinationCountry: string,
  quantity: number = 1,
  defaultShipping: number | null = null,
  defaultShippingCurrency: string = "USD"
): ShippingCalculation | null {
  // Determine the appropriate zone
  const { zone } = determineShippingZone(
    originCountry,
    destinationCountry
  );

  // First, check for a country-specific rate
  const countryRate = shippingRates.find(
    (rate) =>
      rate.type === "country" && rate.countryCode === destinationCountry
  );

  // If country rate found, use it
  if (countryRate) {
    const additionalItemCost =
      countryRate.additionalItem && quantity > 1
        ? countryRate.additionalItem * (quantity - 1)
        : 0;

    const totalPrice = countryRate.price + additionalItemCost;

    return {
      ...countryRate,
      price: totalPrice,
    };
  }

  // If no country rate, look for a zone rate
  const zoneRate = shippingRates.find(
    (rate) =>
      rate.type === "zone" &&
      rate.zone === zone
  );

  // If zone rate found, use it
  if (zoneRate) {
    const additionalItemCost =
      zoneRate.additionalItem && quantity > 1
        ? zoneRate.additionalItem * (quantity - 1)
        : 0;

    const totalPrice = zoneRate.price + additionalItemCost;

    return {
      ...zoneRate,
      price: totalPrice,
    };
  }

  // If no zone rate found, use default shipping if available
  if (defaultShipping !== null && defaultShipping !== undefined) {
    return {
      zone: "WORLDWIDE",
      price: defaultShipping,
      currency: defaultShippingCurrency,
      additionalItem: null,
      serviceLevel: null,
      isFreeShipping: false,
    };
  }

  return null;
}

/**
 * Get the best shipping rate for a destination
 * @param shippingRates - Array of shipping rates
 * @param originCountry - Seller's country
 * @param destinationCountry - Buyer's country
 * @param defaultShipping - Default worldwide shipping cost in cents (optional)
 * @param defaultShippingCurrency - Currency for default shipping (optional)
 * @returns Best shipping rate or null
 */
export function getBestShippingRate(
  shippingRates: ShippingCalculation[],
  originCountry: string,
  destinationCountry: string,
  defaultShipping: number | null = null,
  defaultShippingCurrency: string = "USD"
): ShippingCalculation | null {
  const { zone } = determineShippingZone(
    originCountry,
    destinationCountry
  );

  // First, check for a country-specific rate
  let rate = shippingRates.find(
    (r) => r.type === "country" && r.countryCode === destinationCountry
  );

  // If no country rate, look for a zone rate
  if (!rate) {
    rate = shippingRates.find(
      (r) =>
        r.type === "zone" &&
        r.zone === zone
    );
  }

  // If still no match, use default shipping if available
  if (!rate && defaultShipping !== null && defaultShipping !== undefined) {
    return {
      zone: "WORLDWIDE",
      price: defaultShipping,
      currency: defaultShippingCurrency,
      additionalItem: null,
      serviceLevel: null,
      isFreeShipping: false,
    };
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
 * @param defaultShipping - Default worldwide shipping cost in cents (optional)
 * @param defaultShippingCurrency - Currency for default shipping (optional)
 * @returns boolean indicating if shipping is available
 */
export function isShippingAvailable(
  shippingRates: ShippingCalculation[],
  originCountry: string,
  destinationCountry: string,
  defaultShipping: number | null = null,
  defaultShippingCurrency: string = "USD"
): boolean {
  return (
    getBestShippingRate(
      shippingRates,
      originCountry,
      destinationCountry,
      defaultShipping,
      defaultShippingCurrency
    ) !== null
  );
}

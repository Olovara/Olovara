import { SUPPORTED_COUNTRIES } from "@/data/countries";
import { SHIPPING_ZONES } from "@/data/shipping";
import { EEA_COUNTRIES, NORTHERN_IRELAND_CODE } from "@/lib/gpsr-compliance";
import { getShippableCountries } from "@/data/un-countries";

/**
 * Check if all countries in a zone are excluded
 * This checks if all shippable countries (from getShippableCountries) in the zone are excluded
 * Countries that are sanctioned in UN_COUNTRIES are not in getShippableCountries, so they're not checked
 * @param zoneId - The zone ID to check
 * @param excludedCountries - Array of excluded country codes (from getShippableCountries)
 * @returns boolean - true if all shippable countries in the zone are excluded
 */
export function isZoneFullyExcluded(
  zoneId: string,
  excludedCountries: string[]
): boolean {
  if (!excludedCountries || excludedCountries.length === 0) {
    return false;
  }

  // Get shippable countries in this zone (these are the countries that can be excluded)
  const shippableCountries = getShippableCountries().filter(
    (c) => {
      // Map UN_COUNTRIES region to shipping zone
      // UN_COUNTRIES uses region, SUPPORTED_COUNTRIES uses zone
      const countryInSupported = SUPPORTED_COUNTRIES.find(
        (sc) => sc.code === c.code
      );
      return countryInSupported?.zone === zoneId;
    }
  );
  
  if (shippableCountries.length === 0) {
    return false;
  }

  // Check if all shippable countries in the zone are excluded
  return shippableCountries.every((country) =>
    excludedCountries.includes(country.code)
  );
}

/**
 * Check if Europe zone should be shown
 * Europe should be hidden only if ALL EU countries AND ALL non-EU European countries are excluded
 * This checks against shippable countries (from getShippableCountries) that are in SUPPORTED_COUNTRIES
 * @param excludedCountries - Array of excluded country codes (from getShippableCountries)
 * @returns boolean - true if Europe zone should be shown
 */
export function shouldShowEuropeZone(
  excludedCountries: string[]
): boolean {
  if (!excludedCountries || excludedCountries.length === 0) {
    return true;
  }

  // Get shippable European countries (these are the ones that can be excluded)
  const shippableEuropeanCountries = getShippableCountries().filter((c) => {
    const countryInSupported = SUPPORTED_COUNTRIES.find(
      (sc) => sc.code === c.code
    );
    return countryInSupported?.zone === "EUROPE";
  });

  // Separate EU and non-EU European countries from shippable list
  const euCountries = shippableEuropeanCountries.filter((c) =>
    EEA_COUNTRIES.includes(c.code) || c.code === NORTHERN_IRELAND_CODE
  );
  const nonEuEuropeanCountries = shippableEuropeanCountries.filter(
    (c) => !EEA_COUNTRIES.includes(c.code) && c.code !== NORTHERN_IRELAND_CODE
  );

  // Check if all EU countries are excluded
  const allEUExcluded =
    euCountries.length > 0 &&
    euCountries.every((c) => excludedCountries.includes(c.code));

  // Check if all non-EU European countries are excluded
  const allNonEUExcluded =
    nonEuEuropeanCountries.length > 0 &&
    nonEuEuropeanCountries.every((c) => excludedCountries.includes(c.code));

  // Europe zone should be hidden only if BOTH are fully excluded
  // If all shippable European countries are excluded, also exclude countries in SUPPORTED_COUNTRIES
  // that are in Europe but not in UN_COUNTRIES (like GB and GI)
  return !(allEUExcluded && allNonEUExcluded);
}

/**
 * Get available zones filtered by exclusions
 * @param excludedCountries - Array of excluded country codes
 * @returns Array of available zone IDs
 */
export function getAvailableZones(
  excludedCountries: string[] = []
): string[] {
  return SHIPPING_ZONES.filter((zone) => {
    if (zone.id === "EUROPE") {
      return shouldShowEuropeZone(excludedCountries);
    }
    return !isZoneFullyExcluded(zone.id, excludedCountries);
  }).map((zone) => zone.id);
}

/**
 * Get available countries filtered by exclusions
 * Only returns countries that are in SUPPORTED_COUNTRIES (used for shipping)
 * Also excludes countries whose zone is fully excluded, even if they're not explicitly in the exclusion list
 * (This handles cases where countries are in SUPPORTED_COUNTRIES but sanctioned in UN_COUNTRIES)
 * @param excludedCountries - Array of excluded country codes
 * @returns Array of available country codes from SUPPORTED_COUNTRIES
 */
export function getAvailableCountries(
  excludedCountries: string[] = []
): string[] {
  if (!excludedCountries || excludedCountries.length === 0) {
    return SUPPORTED_COUNTRIES.map((c) => c.code);
  }

  // Filter out excluded countries
  // Also exclude countries whose zone is fully excluded (even if not explicitly in exclusion list)
  return SUPPORTED_COUNTRIES.filter((country) => {
    // Explicitly excluded
    if (excludedCountries.includes(country.code)) {
      return false;
    }

    // Check if the country's zone is fully excluded
    // Special handling for Europe zone
    if (country.zone === "EUROPE") {
      // If Europe zone should be hidden (all shippable countries excluded),
      // also exclude countries in SUPPORTED_COUNTRIES that aren't in UN_COUNTRIES (like GB, GI)
      const shouldShow = shouldShowEuropeZone(excludedCountries);
      if (!shouldShow) {
        return false; // Hide all European countries if zone is fully excluded
      }
      // If zone is not fully excluded, check if this specific country is excluded
      // Countries not in UN_COUNTRIES (like GB, GI) will be excluded if zone is fully excluded
      return true;
    }

    // For other zones, check if the zone is fully excluded
    return !isZoneFullyExcluded(country.zone, excludedCountries);
  }).map((country) => country.code);
}

/**
 * Get available countries for shipping option exceptions
 * This function only filters out explicitly excluded countries, NOT zones
 * This allows sellers to add country-specific exceptions even if the entire zone is excluded
 * For example, a seller from Greece can add a US exception even if they've excluded the entire North America zone
 * @param excludedCountries - Array of explicitly excluded country codes
 * @returns Array of available country codes from SUPPORTED_COUNTRIES (only explicitly excluded countries are filtered)
 */
export function getAvailableCountriesForExceptions(
  excludedCountries: string[] = []
): string[] {
  if (!excludedCountries || excludedCountries.length === 0) {
    return SUPPORTED_COUNTRIES.map((c) => c.code);
  }

  // Only filter out explicitly excluded countries
  // Do NOT filter based on zone exclusions - this allows sellers to add exceptions
  // for specific countries even if the entire zone is excluded
  return SUPPORTED_COUNTRIES.filter((country) => {
    // Only exclude if explicitly in the exclusion list
    return !excludedCountries.includes(country.code);
  }).map((country) => country.code);
}


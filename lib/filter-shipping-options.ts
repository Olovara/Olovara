import { SUPPORTED_COUNTRIES } from "@/data/countries";
import { SHIPPING_ZONES } from "@/data/shipping";
import { EEA_COUNTRIES, NORTHERN_IRELAND_CODE } from "@/lib/gpsr-compliance";

/**
 * Check if all countries in a zone are excluded
 * @param zoneId - The zone ID to check
 * @param excludedCountries - Array of excluded country codes
 * @returns boolean - true if all countries in the zone are excluded
 */
export function isZoneFullyExcluded(
  zoneId: string,
  excludedCountries: string[]
): boolean {
  if (!excludedCountries || excludedCountries.length === 0) {
    return false;
  }

  const zoneCountries = SUPPORTED_COUNTRIES.filter(
    (c) => c.zone === zoneId
  );
  
  if (zoneCountries.length === 0) {
    return false;
  }

  // Check if all countries in the zone are excluded
  return zoneCountries.every((country) =>
    excludedCountries.includes(country.code)
  );
}

/**
 * Check if Europe zone should be shown
 * Europe should be hidden only if ALL EU countries AND ALL non-EU European countries are excluded
 * @param excludedCountries - Array of excluded country codes
 * @returns boolean - true if Europe zone should be shown
 */
export function shouldShowEuropeZone(
  excludedCountries: string[]
): boolean {
  if (!excludedCountries || excludedCountries.length === 0) {
    return true;
  }

  // Get all European countries
  const europeanCountries = SUPPORTED_COUNTRIES.filter(
    (c) => c.zone === "EUROPE"
  );

  // Separate EU and non-EU European countries
  const euCountries = europeanCountries.filter((c) =>
    EEA_COUNTRIES.includes(c.code) || c.code === NORTHERN_IRELAND_CODE
  );
  const nonEuEuropeanCountries = europeanCountries.filter(
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
 * @param excludedCountries - Array of excluded country codes
 * @returns Array of available country codes
 */
export function getAvailableCountries(
  excludedCountries: string[] = []
): string[] {
  if (!excludedCountries || excludedCountries.length === 0) {
    return SUPPORTED_COUNTRIES.map((c) => c.code);
  }

  return SUPPORTED_COUNTRIES.filter(
    (country) => !excludedCountries.includes(country.code)
  ).map((country) => country.code);
}


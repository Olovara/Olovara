import { SUPPORTED_COUNTRIES } from "@/data/countries";
import { SHIPPING_ZONES } from "@/data/shipping";

export interface FormattedExclusions {
  hasExclusions: boolean;
  excludedZones: string[];
  excludedCountries: string[];
}

/**
 * Format excluded countries, grouping by zone when all countries in a zone are excluded
 * @param excludedCountryCodes - Array of excluded country codes
 * @returns Formatted exclusions with zones and individual countries
 */
export function formatCountryExclusions(
  excludedCountryCodes: string[]
): FormattedExclusions {
  if (!excludedCountryCodes || excludedCountryCodes.length === 0) {
    return {
      hasExclusions: false,
      excludedZones: [],
      excludedCountries: [],
    };
  }

  // Group countries by zone
  const countriesByZone = new Map<string, string[]>();
  const excludedCountriesByZone = new Map<string, string[]>();

  // Initialize zones
  SHIPPING_ZONES.forEach((zone) => {
    countriesByZone.set(zone.id, []);
    excludedCountriesByZone.set(zone.id, []);
  });

  // Get all countries for each zone
  SUPPORTED_COUNTRIES.forEach((country) => {
    const zoneCountries = countriesByZone.get(country.zone) || [];
    zoneCountries.push(country.code);
    countriesByZone.set(country.zone, zoneCountries);

    // Check if this country is excluded
    if (excludedCountryCodes.includes(country.code)) {
      const excluded = excludedCountriesByZone.get(country.zone) || [];
      excluded.push(country.code);
      excludedCountriesByZone.set(country.zone, excluded);
    }
  });

  // Determine which zones are fully excluded and which countries are individually excluded
  const excludedZones: string[] = [];
  const excludedCountries: string[] = [];

  SHIPPING_ZONES.forEach((zone) => {
    const zoneCountries = countriesByZone.get(zone.id) || [];
    const zoneExcluded = excludedCountriesByZone.get(zone.id) || [];

    // If all countries in the zone are excluded, add the zone
    if (zoneCountries.length > 0 && zoneExcluded.length === zoneCountries.length) {
      excludedZones.push(zone.name);
    } else {
      // Otherwise, add individual excluded countries from this zone
      zoneExcluded.forEach((countryCode) => {
        const country = SUPPORTED_COUNTRIES.find((c) => c.code === countryCode);
        if (country) {
          excludedCountries.push(country.name);
        }
      });
    }
  });

  return {
    hasExclusions: true,
    excludedZones,
    excludedCountries,
  };
}


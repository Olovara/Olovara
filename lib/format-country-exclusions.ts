import { SUPPORTED_COUNTRIES } from "@/data/countries";
import { SHIPPING_ZONES } from "@/data/shipping";
import { isZoneFullyExcluded, shouldShowEuropeZone } from "./filter-shipping-options";
import { EEA_COUNTRIES, NORTHERN_IRELAND_CODE } from "@/lib/gpsr-compliance";

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

  // Use the same logic as filter-shipping-options to determine fully excluded zones
  const excludedZones: string[] = [];
  const excludedCountries: string[] = [];

  SHIPPING_ZONES.forEach((zone) => {
    if (zone.id === "EUROPE") {
      // Special handling for Europe zone - use the same logic as shouldShowEuropeZone
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
        euCountries.every((c) => excludedCountryCodes.includes(c.code));

      // Check if all non-EU European countries are excluded
      const allNonEUExcluded =
        nonEuEuropeanCountries.length > 0 &&
        nonEuEuropeanCountries.every((c) => excludedCountryCodes.includes(c.code));

      // Europe zone is fully excluded if BOTH are fully excluded
      if (allEUExcluded && allNonEUExcluded) {
        excludedZones.push(zone.name);
      } else {
        // Show individual excluded countries from Europe
        europeanCountries.forEach((country) => {
          if (excludedCountryCodes.includes(country.code)) {
            // Avoid duplicates
            if (!excludedCountries.includes(country.name)) {
              excludedCountries.push(country.name);
            }
          }
        });
      }
    } else {
      // For other zones, check if the entire zone is excluded
      if (isZoneFullyExcluded(zone.id, excludedCountryCodes)) {
        excludedZones.push(zone.name);
      } else {
        // If zone is not fully excluded, show individual excluded countries from this zone
        const zoneCountries = SUPPORTED_COUNTRIES.filter(
          (c) => c.zone === zone.id
        );
        zoneCountries.forEach((country) => {
          if (excludedCountryCodes.includes(country.code)) {
            // Avoid duplicates
            if (!excludedCountries.includes(country.name)) {
              excludedCountries.push(country.name);
            }
          }
        });
      }
    }
  });

  return {
    hasExclusions: true,
    excludedZones,
    excludedCountries,
  };
}


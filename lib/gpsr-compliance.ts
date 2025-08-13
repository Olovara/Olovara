// GPSR (General Product Safety Regulation) compliance utilities

// EU member states that require GPSR compliance
export const EU_MEMBER_STATES = [
  'AT', // Austria
  'BE', // Belgium
  'BG', // Bulgaria
  'HR', // Croatia
  'CY', // Cyprus
  'CZ', // Czech Republic
  'DK', // Denmark
  'EE', // Estonia
  'FI', // Finland
  'FR', // France
  'DE', // Germany
  'GR', // Greece
  'HU', // Hungary
  'IE', // Ireland
  'IT', // Italy
  'LV', // Latvia
  'LT', // Lithuania
  'LU', // Luxembourg
  'MT', // Malta
  'NL', // Netherlands
  'PL', // Poland
  'PT', // Portugal
  'RO', // Romania
  'SK', // Slovakia
  'SI', // Slovenia
  'ES', // Spain
  'SE', // Sweden
];

// EEA countries (EU + Norway, Iceland, Liechtenstein)
export const EEA_COUNTRIES = [
  ...EU_MEMBER_STATES,
  'NO', // Norway
  'IS', // Iceland
  'LI', // Liechtenstein
];

// Northern Ireland (special case - requires EU compliance but is part of UK)
// Using NIR to avoid conflict with Nicaragua (NI)
export const NORTHERN_IRELAND_CODE = 'NIR';

// All countries that require GPSR compliance (EEA + Northern Ireland)
export const GPSR_REQUIRED_COUNTRIES = [
  ...EEA_COUNTRIES,
  NORTHERN_IRELAND_CODE,
];

/**
 * Check if GPSR compliance is required based on shipping destinations
 * @param excludedCountries - Array of country codes that are excluded from shipping
 * @param allCountries - Array of all available country codes
 * @returns boolean indicating if GPSR compliance is required
 */
export function isGPSRComplianceRequired(
  excludedCountries: string[] = [],
  allCountries: string[] = []
): boolean {
  // If no countries are excluded, seller ships worldwide (including EU)
  if (excludedCountries.length === 0) {
    return true;
  }

  // Check if any EEA countries are NOT excluded (meaning seller ships to EEA)
  const shipsToEEA = EEA_COUNTRIES.some(
    eeaCountry => !excludedCountries.includes(eeaCountry)
  );

  // Check if Northern Ireland is NOT excluded (special case)
  const shipsToNorthernIreland = !excludedCountries.includes(NORTHERN_IRELAND_CODE);

  return shipsToEEA || shipsToNorthernIreland;
}

/**
 * Check if a specific country requires GPSR compliance
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns boolean indicating if the country requires GPSR compliance
 */
export function isCountryGPSRCompliant(countryCode: string): boolean {
  return GPSR_REQUIRED_COUNTRIES.includes(countryCode.toUpperCase());
}

/**
 * Get list of countries that require GPSR compliance from a list of shipping destinations
 * @param shippingCountries - Array of country codes where seller ships
 * @returns Array of country codes that require GPSR compliance
 */
export function getGPSRRequiredCountries(shippingCountries: string[]): string[] {
  return shippingCountries.filter(country => 
    isCountryGPSRCompliant(country)
  );
}

/**
 * Validate GPSR compliance data
 * @param gpsrData - Object containing GPSR compliance fields
 * @param isRequired - Whether GPSR compliance is required
 * @returns Object with validation results
 */
export function validateGPSRCompliance(gpsrData: {
  safetyWarnings?: string;
  materialsComposition?: string;
  safeUseInstructions?: string;
  ageRestriction?: string;
  chokingHazard?: boolean;
  smallPartsWarning?: boolean;
  chemicalWarnings?: string;
  careInstructions?: string;
}, isRequired: boolean = false) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (isRequired) {
    // Required fields for EU compliance
    if (!gpsrData.safetyWarnings?.trim()) {
      errors.push('Safety warnings are required for EU compliance');
    }
    if (!gpsrData.materialsComposition?.trim()) {
      errors.push('Materials composition is required for EU compliance');
    }
    if (!gpsrData.safeUseInstructions?.trim()) {
      errors.push('Safe use instructions are required for EU compliance');
    }
  } else {
    // Optional but recommended fields
    if (!gpsrData.safetyWarnings?.trim()) {
      warnings.push('Safety warnings are recommended for product safety');
    }
    if (!gpsrData.materialsComposition?.trim()) {
      warnings.push('Materials composition is recommended for transparency');
    }
  }

  // Check for potential safety issues
  if (gpsrData.chokingHazard && !gpsrData.ageRestriction?.toLowerCase().includes('3')) {
    warnings.push('Consider adding age restriction for products with choking hazards');
  }

  if (gpsrData.smallPartsWarning && !gpsrData.ageRestriction?.toLowerCase().includes('young')) {
    warnings.push('Consider adding age restriction for products with small parts');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    isCompliant: isRequired ? errors.length === 0 : true,
  };
}

/**
 * Generate GPSR compliance summary for display
 * @param gpsrData - Object containing GPSR compliance fields
 * @param isRequired - Whether GPSR compliance is required
 * @returns Object with compliance summary
 */
export function getGPSRComplianceSummary(gpsrData: {
  safetyWarnings?: string;
  materialsComposition?: string;
  safeUseInstructions?: string;
  ageRestriction?: string;
  chokingHazard?: boolean;
  smallPartsWarning?: boolean;
  chemicalWarnings?: string;
  careInstructions?: string;
}, isRequired: boolean = false) {
  const validation = validateGPSRCompliance(gpsrData, isRequired);
  
  const hasSafetyInfo = !!(
    gpsrData.safetyWarnings?.trim() ||
    gpsrData.materialsComposition?.trim() ||
    gpsrData.safeUseInstructions?.trim()
  );

  const hasWarnings = !!(
    gpsrData.chokingHazard ||
    gpsrData.smallPartsWarning ||
    gpsrData.ageRestriction?.trim() ||
    gpsrData.chemicalWarnings?.trim()
  );

  return {
    isCompliant: validation.isCompliant,
    hasSafetyInfo,
    hasWarnings,
    validation,
    status: isRequired 
      ? (validation.isCompliant ? 'compliant' : 'non-compliant')
      : (hasSafetyInfo ? 'informational' : 'none'),
  };
}

/**
 * Format business address for display
 * @param address - Business address object
 * @returns Formatted address string
 */
export function formatBusinessAddress(address: {
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}): string {
  const parts = [
    address.street,
    address.street2,
    address.city,
    address.state,
    address.postalCode,
    address.country
  ].filter(Boolean);

  return parts.join(', ');
}

/**
 * Check if seller has provided complete business address
 * @param address - Business address object
 * @returns boolean indicating if address is complete
 */
export function hasCompleteBusinessAddress(address: {
  street?: string;
  city?: string;
  country?: string;
}): boolean {
  return !!(address.street?.trim() && 
           address.city?.trim() && 
           address.country?.trim());
}

// Currency configurations - Updated to match all supported countries
export const SUPPORTED_CURRENCIES = [
  // Major currencies
  { code: "USD", decimals: 2, symbol: "$", name: "US Dollar" },
  { code: "EUR", decimals: 2, symbol: "€", name: "Euro" },
  { code: "GBP", decimals: 2, symbol: "£", name: "British Pound" },
  { code: "CAD", decimals: 2, symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", decimals: 2, symbol: "A$", name: "Australian Dollar" },
  { code: "JPY", decimals: 0, symbol: "¥", name: "Japanese Yen" },
  { code: "INR", decimals: 2, symbol: "₹", name: "Indian Rupee" },
  { code: "SGD", decimals: 2, symbol: "S$", name: "Singapore Dollar" },

  // European currencies
  { code: "CHF", decimals: 2, symbol: "Fr", name: "Swiss Franc" },
  { code: "DKK", decimals: 2, symbol: "kr", name: "Danish Krone" },
  { code: "NOK", decimals: 2, symbol: "kr", name: "Norwegian Krone" },
  { code: "SEK", decimals: 2, symbol: "kr", name: "Swedish Krona" },
  { code: "CZK", decimals: 2, symbol: "Kč", name: "Czech Koruna" },
  { code: "HUF", decimals: 0, symbol: "Ft", name: "Hungarian Forint" },
  { code: "BGN", decimals: 2, symbol: "лв", name: "Bulgarian Lev" },
  { code: "RON", decimals: 2, symbol: "lei", name: "Romanian Leu" },
  { code: "GIP", decimals: 2, symbol: "£", name: "Gibraltar Pound" },
  { code: "PLN", decimals: 2, symbol: "zł", name: "Polish Zloty" },

  // Asian currencies
  { code: "HKD", decimals: 2, symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "THB", decimals: 2, symbol: "฿", name: "Thai Baht" },
  { code: "MYR", decimals: 2, symbol: "RM", name: "Malaysian Ringgit" },
  { code: "IDR", decimals: 0, symbol: "Rp", name: "Indonesian Rupiah" },

  // Oceania currencies
  { code: "NZD", decimals: 2, symbol: "NZ$", name: "New Zealand Dollar" },

  // South American currencies
  { code: "BRL", decimals: 2, symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", decimals: 2, symbol: "$", name: "Mexican Peso" },

  // African currencies
  { code: "ZAR", decimals: 2, symbol: "R", name: "South African Rand" },
  { code: "GHS", decimals: 2, symbol: "₵", name: "Ghanaian Cedi" },
  { code: "KES", decimals: 2, symbol: "KSh", name: "Kenyan Shilling" },
  { code: "NGN", decimals: 2, symbol: "₦", name: "Nigerian Naira" },
  { code: "XOF", decimals: 0, symbol: "CFA", name: "West African CFA Franc" },

  // Middle East currencies
  { code: "AED", decimals: 2, symbol: "د.إ", name: "UAE Dirham" },
] as const;

// Weight unit configurations
export const SUPPORTED_WEIGHT_UNITS = [
  { code: "kg", name: "Kilograms", symbol: "kg", conversion: 1 }, // Base unit
  { code: "g", name: "Grams", symbol: "g", conversion: 0.001 },
  { code: "lbs", name: "Pounds", symbol: "lbs", conversion: 0.45359237 },
  { code: "oz", name: "Ounces", symbol: "oz", conversion: 0.0283495 },
] as const;

// Dimension unit configurations
export const SUPPORTED_DIMENSION_UNITS = [
  { code: "cm", name: "Centimeters", symbol: "cm", conversion: 1 }, // Base unit
  { code: "m", name: "Meters", symbol: "m", conversion: 100 },
  { code: "in", name: "Inches", symbol: "in", conversion: 2.54 },
  { code: "ft", name: "Feet", symbol: "ft", conversion: 30.48 },
] as const;

// Distance unit configurations
export const SUPPORTED_DISTANCE_UNITS = [
  { code: "km", name: "Kilometers", symbol: "km", conversion: 1 }, // Base unit
  { code: "miles", name: "Miles", symbol: "mi", conversion: 1.60934 },
] as const;

// Helper functions
/** Minor decimal places Stripe uses for the currency (0 for JPY, 2 for USD, …). */
export const getCurrencyDecimals = (currency: string): number => {
  // Use ?? not || — zero-decimal currencies (JPY, HUF, …) must stay 0
  return SUPPORTED_CURRENCIES.find((c) => c.code === currency)?.decimals ?? 2;
};

/** True for JPY, HUF, IDR, XOF — use for input `step` / whole-unit majors. */
export function isZeroDecimalCurrency(currency: string): boolean {
  const d = SUPPORTED_CURRENCIES.find((c) => c.code === currency)?.decimals;
  return d === 0;
}

/** Major display amount (e.g. dollars) → minor units for storage (e.g. cents), per currency decimals. */
export function majorToMinorAmount(major: number, currencyCode: string): number {
  const decimals = getCurrencyDecimals(currencyCode);
  return Math.round(major * 10 ** decimals);
}

/** Minor units from storage → major amount for forms and display. */
export function minorToMajorAmount(minor: number, currencyCode: string): number {
  const decimals = getCurrencyDecimals(currencyCode);
  return minor / 10 ** decimals;
}

export const getCurrencySymbol = (currency: string) => {
  return SUPPORTED_CURRENCIES.find((c) => c.code === currency)?.symbol || "$";
};

export const getCurrencyName = (currency: string) => {
  return (
    SUPPORTED_CURRENCIES.find((c) => c.code === currency)?.name || "US Dollar"
  );
};

// Type definitions
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];
export type WeightUnit = (typeof SUPPORTED_WEIGHT_UNITS)[number]["code"];
export type DimensionUnit = (typeof SUPPORTED_DIMENSION_UNITS)[number]["code"];
export type DistanceUnit = (typeof SUPPORTED_DISTANCE_UNITS)[number]["code"];

// Conversion functions
export const convertWeight = (
  value: number,
  fromUnit: WeightUnit,
  toUnit: WeightUnit
) => {
  const from = SUPPORTED_WEIGHT_UNITS.find((u) => u.code === fromUnit);
  const to = SUPPORTED_WEIGHT_UNITS.find((u) => u.code === toUnit);
  if (!from || !to) return value;
  return (value * from.conversion) / to.conversion;
};

export const convertDimension = (
  value: number,
  fromUnit: DimensionUnit,
  toUnit: DimensionUnit
) => {
  const from = SUPPORTED_DIMENSION_UNITS.find((u) => u.code === fromUnit);
  const to = SUPPORTED_DIMENSION_UNITS.find((u) => u.code === toUnit);
  if (!from || !to) return value;
  return (value * from.conversion) / to.conversion;
};

export const convertDistance = (
  value: number,
  fromUnit: DistanceUnit,
  toUnit: DistanceUnit
) => {
  const from = SUPPORTED_DISTANCE_UNITS.find((u) => u.code === fromUnit);
  const to = SUPPORTED_DISTANCE_UNITS.find((u) => u.code === toUnit);
  if (!from || !to) return value;
  return (value * from.conversion) / to.conversion;
};

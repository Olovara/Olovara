// Currency configurations
export const SUPPORTED_CURRENCIES = [
  { code: "USD", decimals: 2, symbol: "$", name: "US Dollar" },
  { code: "EUR", decimals: 2, symbol: "€", name: "Euro" },
  { code: "GBP", decimals: 2, symbol: "£", name: "British Pound" },
  { code: "CAD", decimals: 2, symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", decimals: 2, symbol: "A$", name: "Australian Dollar" },
  { code: "JPY", decimals: 0, symbol: "¥", name: "Japanese Yen" },
  { code: "INR", decimals: 2, symbol: "₹", name: "Indian Rupee" },
  { code: "SGD", decimals: 2, symbol: "S$", name: "Singapore Dollar" },
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
export const getCurrencyDecimals = (currency: string) => {
  return SUPPORTED_CURRENCIES.find(c => c.code === currency)?.decimals || 2;
};

export const getCurrencySymbol = (currency: string) => {
  return SUPPORTED_CURRENCIES.find(c => c.code === currency)?.symbol || "$";
};

export const getCurrencyName = (currency: string) => {
  return SUPPORTED_CURRENCIES.find(c => c.code === currency)?.name || "US Dollar";
};

// Type definitions
export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]['code'];
export type WeightUnit = typeof SUPPORTED_WEIGHT_UNITS[number]['code'];
export type DimensionUnit = typeof SUPPORTED_DIMENSION_UNITS[number]['code'];
export type DistanceUnit = typeof SUPPORTED_DISTANCE_UNITS[number]['code'];

// Conversion functions
export const convertWeight = (value: number, fromUnit: WeightUnit, toUnit: WeightUnit) => {
  const from = SUPPORTED_WEIGHT_UNITS.find(u => u.code === fromUnit);
  const to = SUPPORTED_WEIGHT_UNITS.find(u => u.code === toUnit);
  if (!from || !to) return value;
  return (value * from.conversion) / to.conversion;
};

export const convertDimension = (value: number, fromUnit: DimensionUnit, toUnit: DimensionUnit) => {
  const from = SUPPORTED_DIMENSION_UNITS.find(u => u.code === fromUnit);
  const to = SUPPORTED_DIMENSION_UNITS.find(u => u.code === toUnit);
  if (!from || !to) return value;
  return (value * from.conversion) / to.conversion;
};

export const convertDistance = (value: number, fromUnit: DistanceUnit, toUnit: DistanceUnit) => {
  const from = SUPPORTED_DISTANCE_UNITS.find(u => u.code === fromUnit);
  const to = SUPPORTED_DISTANCE_UNITS.find(u => u.code === toUnit);
  if (!from || !to) return value;
  return (value * from.conversion) / to.conversion;
}; 
import * as z from "zod";
import { 
  SUPPORTED_CURRENCIES, 
  SUPPORTED_WEIGHT_UNITS, 
  SUPPORTED_DIMENSION_UNITS,
  SUPPORTED_DISTANCE_UNITS 
} from "@/data/units";
import { getOnboardingCountries, getCountryByCode } from "@/data/countries";

// Get supported country codes
const SUPPORTED_COUNTRY_CODES = getOnboardingCountries().map(country => country.code);

export const SellerSchema = z.object({
  shopName: z.string().min(3, "Shop name is required"),
  shopDescription: z.string().min(6, "Shop description is required"),
  preferredCurrency: z.enum(SUPPORTED_CURRENCIES.map(c => c.code) as [string, ...string[]], {
    required_error: "Please select a currency",
  }).default("USD"),
  preferredWeightUnit: z.enum(SUPPORTED_WEIGHT_UNITS.map(u => u.code) as [string, ...string[]], {
    required_error: "Please select a weight unit",
  }).default("lbs"),
  preferredDimensionUnit: z.enum(SUPPORTED_DIMENSION_UNITS.map(u => u.code) as [string, ...string[]], {
    required_error: "Please select a dimension unit",
  }).default("in"),
  preferredDistanceUnit: z.enum(SUPPORTED_DISTANCE_UNITS.map(u => u.code) as [string, ...string[]], {
    required_error: "Please select a distance unit",
  }).default("miles"),
  isWomanOwned: z.boolean().default(false),
  isMinorityOwned: z.boolean().default(false),
  isLGBTQOwned: z.boolean().default(false),
  isVeteranOwned: z.boolean().default(false),
  isSustainable: z.boolean().default(false),
  isCharitable: z.boolean().default(false),
  valuesPreferNotToSay: z.boolean().default(false),
  // Tax fields
  businessName: z.string().min(3, "Business name is required"),
  taxId: z.string().min(1, "Tax ID is required"),
  businessAddress: z.string().min(1, "Business address is required"),
  businessCity: z.string().min(1, "City is required"),
  businessState: z.string().optional(),
  businessPostalCode: z.string().min(1, "Postal code is required"),
  taxCountry: z.enum(SUPPORTED_COUNTRY_CODES as [string, ...string[]], {
    required_error: "Please select a country",
  }).default("US"),
  additionalTaxRegistrations: z.string().optional(),
}).superRefine((data, ctx) => {
  // Validate tax ID format based on country
  const taxIdRegex: Record<string, RegExp> = {
    US: /^(\d{2}-\d{7}|\d{3}-\d{2}-\d{4})$/, // EIN (XX-XXXXXXX) or SSN (XXX-XX-XXXX)
    CA: /^\d{9}RT\d{4}$/, // Business Number format
    GB: /^GB\d{9}$/, // VAT number format
    AU: /^\d{11}$/, // ABN format
    JP: /^\d{13}$/, // Corporate Number format
    IN: /^\d{15}$/, // GSTIN format
    SG: /^\d{8}[A-Z]$/, // UEN format
  };

  const country = getCountryByCode(data.taxCountry);
  if (country?.isEU) {
    // EU VAT number format
    taxIdRegex[data.taxCountry] = /^[A-Z]{2}\d{9}$/;
  }

  const regex = taxIdRegex[data.taxCountry];
  if (regex && !regex.test(data.taxId)) {
    ctx.addIssue({
      code: "custom",
      message: `Invalid tax ID format for ${data.taxCountry}. Please check the format and try again.`,
      path: ["taxId"],
    });
  }
});
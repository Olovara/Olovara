import * as z from "zod";
import { getOnboardingCountries, getCountryByCode } from "@/data/countries";

// Get supported country codes
const SUPPORTED_COUNTRY_CODES = getOnboardingCountries().map(country => country.code);

export const SellerInfoSchema = z.object({
  // Vacation mode
  isVacationMode: z.boolean().default(false),
  // Custom orders
  acceptsCustom: z.boolean().default(false),
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
  // Social media links
  facebookUrl: z.string().url("Must be a valid Facebook URL").optional().or(z.literal("")),
  instagramUrl: z.string().url("Must be a valid Instagram URL").optional().or(z.literal("")),
  twitterUrl: z.string().url("Must be a valid Twitter URL").optional().or(z.literal("")),
  pinterestUrl: z.string().url("Must be a valid Pinterest URL").optional().or(z.literal("")),
  tiktokUrl: z.string().url("Must be a valid TikTok URL").optional().or(z.literal("")),
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

export type SellerInfoFormData = z.infer<typeof SellerInfoSchema>; 
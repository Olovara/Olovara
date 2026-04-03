import * as z from "zod";
import { getOnboardingCountries, getCountryByCode } from "@/data/countries";
import { getStatesByCountry, hasStates } from "@/data/states";

// Get supported country codes
const SUPPORTED_COUNTRY_CODES = getOnboardingCountries().map(
  (country) => country.code
);

export const SellerInfoSchema = z
  .object({
  // Vacation mode
  isVacationMode: z.boolean().default(false),
  // Custom orders
  acceptsCustom: z.boolean().default(false),
  /** Seller currency from preferences — used to interpret minimum budget; not edited on this form. */
  preferredCurrency: z.string().default("USD"),
  /** Empty = no minimum; otherwise major-unit amount in preferredCurrency */
  customOrderMinBudgetInput: z.string().optional().default(""),
  // Location fields
  shopCountry: z
    .enum(SUPPORTED_COUNTRY_CODES as [string, ...string[]], {
      required_error: "Please select a country",
    })
    .default("US"),
  shopState: z.string().optional(),
  shopCity: z.string().optional(),
  // Social media links
  facebookUrl: z
    .string()
    .url("Must be a valid Facebook URL")
    .optional()
    .or(z.literal("")),
  instagramUrl: z
    .string()
    .url("Must be a valid Instagram URL")
    .optional()
    .or(z.literal("")),
  pinterestUrl: z
    .string()
    .url("Must be a valid Pinterest URL")
    .optional()
    .or(z.literal("")),
  tiktokUrl: z
    .string()
    .url("Must be a valid TikTok URL")
    .optional()
    .or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (!data.acceptsCustom) return;
    const raw = data.customOrderMinBudgetInput?.trim() ?? "";
    if (raw === "") return;
    const normalized = raw.replace(",", ".");
    const n = parseFloat(normalized);
    if (!Number.isFinite(n) || n < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid minimum budget, or leave blank for no minimum",
        path: ["customOrderMinBudgetInput"],
      });
    }
  });

export type SellerInfoFormData = z.infer<typeof SellerInfoSchema>;

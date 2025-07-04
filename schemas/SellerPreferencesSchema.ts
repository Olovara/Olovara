import * as z from "zod";
import { 
  SUPPORTED_CURRENCIES, 
  SUPPORTED_WEIGHT_UNITS, 
  SUPPORTED_DIMENSION_UNITS,
  SUPPORTED_DISTANCE_UNITS 
} from "@/data/units";

export const SellerPreferencesSchema = z.object({
  // Unit preferences
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
  // Shop values
  isWomanOwned: z.boolean().default(false),
  isMinorityOwned: z.boolean().default(false),
  isLGBTQOwned: z.boolean().default(false),
  isVeteranOwned: z.boolean().default(false),
  isSustainable: z.boolean().default(false),
  isCharitable: z.boolean().default(false),
  valuesPreferNotToSay: z.boolean().default(false),
});

export type SellerPreferencesFormData = z.infer<typeof SellerPreferencesSchema>; 
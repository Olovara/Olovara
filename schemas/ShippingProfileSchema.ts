import * as z from "zod";
import { SUPPORTED_CURRENCIES } from "@/data/units";
import { SHIPPING_ZONES, SHIPPING_SERVICE_LEVELS } from "@/data/shipping";

// Create a base schema for monetary values
const createMonetarySchema = (fieldName: string) => {
  return z.preprocess(
    (val) => {
      if (typeof val === "string") return parseFloat(val);
      if (typeof val === "number") return val;
      return 0;
    },
    z.number()
      .min(0.01, `${fieldName} must be at least $0.01`)
      .refine((val) => Number.isFinite(val), {
        message: `${fieldName} must be a valid number`,
      })
  );
};

export const ShippingRateSchema = z.object({
  id: z.string(),
  zone: z.enum(SHIPPING_ZONES.map(z => z.id) as [string, ...string[]], {
    required_error: "Please select a shipping zone",
  }),
  isInternational: z.boolean().default(false),
  price: createMonetarySchema("price"),
  currency: z.enum(SUPPORTED_CURRENCIES.map(c => c.code) as [string, ...string[]], {
    required_error: "Please select a currency",
  }).default("USD"),
  estimatedDays: z.preprocess(
    (val) => {
      if (typeof val === "string") return parseInt(val);
      if (typeof val === "number") return val;
      return 0;
    },
    z.number()
      .int()
      .min(1, "Estimated days must be at least 1")
      .max(90, "Estimated days cannot exceed 90")
  ),
  additionalItem: z.preprocess(
    (val) => {
      if (typeof val === "string") return parseFloat(val);
      if (typeof val === "number") return val;
      return null;
    },
    z.number()
      .min(0, "Additional item cost must be at least $0")
      .nullable()
  ),
  serviceLevel: z.enum(SHIPPING_SERVICE_LEVELS.map(s => s.id) as [string, ...string[]]).nullable(),
  isFreeShipping: z.boolean().default(false),
}).transform((data) => ({
  ...data,
  price: Math.round(data.price * 100), // Convert to cents
  additionalItem: data.additionalItem ? Math.round(data.additionalItem * 100) : null,
}));

export const ShippingProfileSchema = z.object({
  name: z.string().min(1, {
    message: "Please enter a name for the shipping profile.",
  }),
  isDefault: z.boolean().default(false),
  countryOfOrigin: z.string().min(1, {
    message: "Country of origin is required.",
  }),
  rates: z.array(ShippingRateSchema).min(1, {
    message: "Please add at least one shipping rate.",
  }),
});

export type ShippingProfileFormValues = z.infer<typeof ShippingProfileSchema>;
export type ShippingRateFormValues = z.infer<typeof ShippingRateSchema>;

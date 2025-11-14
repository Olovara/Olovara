import * as z from "zod";
import { SUPPORTED_CURRENCIES, getCurrencyDecimals } from "@/data/units";
import { SHIPPING_ZONES } from "@/data/shipping";

// Create a base schema for monetary values
const createMonetarySchema = (fieldName: string) => {
  return z.preprocess(
    (val) => {
      if (typeof val === "string") return parseFloat(val);
      if (typeof val === "number") return val;
      return 0;
    },
    z
      .number()
      .min(0.01, `${fieldName} must be at least $0.01`)
      .refine((val) => Number.isFinite(val), {
        message: `${fieldName} must be a valid number`,
      })
  );
};

export const ShippingRateSchema = z
  .object({
    id: z.string(),
    type: z.enum(["zone", "country"], {
      required_error: "Please select zone or country",
    }),
    zone: z.string().optional(),
    countryCode: z.string().optional(),
    price: createMonetarySchema("price"),
    additionalItem: z.preprocess((val) => {
      if (typeof val === "string") return parseFloat(val);
      if (typeof val === "number") return val;
      return null;
    }, z.number().min(0, "Additional item cost must be at least $0").nullable()),
    isFreeShipping: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.type === "zone") {
        return data.zone !== undefined && data.zone !== "";
      }
      if (data.type === "country") {
        return data.countryCode !== undefined && data.countryCode !== "";
      }
      return false;
    },
    {
      message: "Zone is required when type is zone, or country is required when type is country",
    }
  )
  .transform((data) => ({
    ...data,
    price: Math.round(data.price * 100), // Convert to cents
    additionalItem: data.additionalItem
      ? Math.round(data.additionalItem * 100)
      : null,
  }));

export const ShippingOptionSchema = z
  .object({
    name: z.string().min(1, {
      message: "Please enter a name for the shipping option.",
    }),
    isDefault: z.boolean().default(false),
    countryOfOrigin: z.string().min(1, {
      message: "Country of origin is required.",
    }),
    defaultShipping: z.preprocess(
      (val) => {
        if (val === null || val === undefined || val === "") return null;
        if (typeof val === "string") return parseFloat(val);
        if (typeof val === "number") return val;
        return null;
      },
      z
        .number()
        .min(0, "Default shipping must be at least $0")
        .refine((val) => Number.isFinite(val), {
          message: "Default shipping must be a valid number",
        })
        .nullable()
        .optional()
    ),
    defaultShippingCurrency: z
      .enum(SUPPORTED_CURRENCIES.map((c) => c.code) as [string, ...string[]], {
        required_error: "Please select a currency",
      })
      .default("USD"),
    rates: z.array(ShippingRateSchema).min(1, {
      message: "Please add at least one shipping rate.",
    }),
  })
  .transform((data) => {
    // Convert defaultShipping to smallest currency unit (cents or equivalent)
    let defaultShippingInCents = null;
    if (data.defaultShipping !== null && data.defaultShipping !== undefined) {
      const decimals = getCurrencyDecimals(data.defaultShippingCurrency);
      const multiplier = Math.pow(10, decimals);
      defaultShippingInCents = Math.round(data.defaultShipping * multiplier);
    }

    return {
      ...data,
      defaultShipping: defaultShippingInCents,
    };
  });

export type ShippingOptionFormValues = z.infer<typeof ShippingOptionSchema>;
export type ShippingRateFormValues = z.infer<typeof ShippingRateSchema>;

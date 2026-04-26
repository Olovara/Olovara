import { z } from "zod";

export const AddressSchema = z.object({
  name: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),

  line1: z.string(),
  line2: z.string().optional(),
  city: z.string(),
  state: z.string().optional(),
  postalCode: z.string(),
  country: z.string().length(2),
});

export type Address = z.infer<typeof AddressSchema>;

export const ParcelSchema = z.object({
  weight: z.object({
    value: z.number().positive(),
    unit: z.enum(["oz", "lb", "g", "kg"]),
  }),
  dimensions: z
    .object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
      unit: z.enum(["in", "cm"]),
    })
    .optional(),
});

export type Parcel = z.infer<typeof ParcelSchema>;

export const MoneySchema = z.object({
  currency: z.string().min(3).max(3),
  amountMinor: z.number().int().nonnegative(),
});

export type Money = z.infer<typeof MoneySchema>;

export type CarrierCode = "USPS" | "UPS" | "FEDEX" | "DHL" | (string & {});

export type RateType = "list" | "negotiated";

export const ShippingRateSchema = z.object({
  provider: z.string(), // e.g. "usps"
  carrier: z.string(), // e.g. "USPS"
  serviceCode: z.string(), // provider-specific
  serviceName: z.string(),
  rateType: z.enum(["list", "negotiated"]).default("list"),
  total: MoneySchema,
  deliveryDays: z.number().int().positive().optional(),
  estimatedDeliveryDateISO: z.string().optional(),

  // Raw provider payload for debugging/auditing (do not trust shape)
  raw: z.unknown().optional(),
});

export type ShippingRate = z.infer<typeof ShippingRateSchema>;

export const RateRequestSchema = z.object({
  shipFrom: AddressSchema,
  shipTo: AddressSchema,
  parcels: z.array(ParcelSchema).min(1),
  currency: z.string().min(3).max(3).default("USD"),

  // Optional constraints/filters
  allowedCarriers: z.array(z.string()).optional(),
  allowedServices: z.array(z.string()).optional(),
  maxDeliveryDays: z.number().int().positive().optional(),
});

export type RateRequest = z.infer<typeof RateRequestSchema>;

export const BuyLabelRequestSchema = z.object({
  provider: z.string(), // e.g. "usps"
  carrier: z.string(), // e.g. "USPS"
  serviceCode: z.string(),

  shipFrom: AddressSchema,
  shipTo: AddressSchema,
  parcels: z.array(ParcelSchema).min(1),

  // Price protection: client tells us which rate they accepted.
  acceptedTotal: MoneySchema,

  // Optional references for your DB layer
  orderId: z.string().optional(),
});

export type BuyLabelRequest = z.infer<typeof BuyLabelRequestSchema>;

export const BuyLabelResponseSchema = z.object({
  provider: z.string(),
  carrier: z.string(),
  serviceCode: z.string(),
  serviceName: z.string().optional(),

  trackingNumber: z.string().optional(),
  trackingUrl: z.string().optional(),

  label: z.object({
    format: z.enum(["PDF", "PNG", "ZPL"]),
    // Either a hosted URL or base64 content (some providers return base64).
    url: z.string().url().optional(),
    base64: z.string().optional(),
  }),

  total: MoneySchema,
  raw: z.unknown().optional(),
});

export type BuyLabelResponse = z.infer<typeof BuyLabelResponseSchema>;


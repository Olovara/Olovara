import { z } from "zod";
import type { Address } from "@/lib/shipping-carriers/types";

/**
 * Ship-from the seller saves for USPS (platform account buys the label; origin is still the seller’s address).
 */
export const UspsOriginAddressSchema = z.object({
  name: z.string().min(1, "Name is required"),
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State / province is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z
    .string()
    .min(2)
    .max(2)
    .transform((c) => c.trim().toUpperCase()),
});

export type UspsOriginAddress = z.infer<typeof UspsOriginAddressSchema>;

/** Maps stored seller origin JSON → normalized `Address` for carrier APIs. */
export function uspsOriginToShipFromAddress(origin: UspsOriginAddress): Address {
  return {
    name: origin.name,
    line1: origin.line1,
    line2: origin.line2,
    city: origin.city,
    state: origin.state,
    postalCode: origin.postalCode,
    country: origin.country,
  };
}

export function parseUspsOriginAddress(
  raw: unknown,
): { ok: true; value: UspsOriginAddress } | { ok: false; message: string } {
  const parsed = UspsOriginAddressSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.entries(first)
      .map(([k, v]) => `${k}: ${(v || []).join(", ")}`)
      .join("; ");
    return { ok: false, message: msg || "Invalid USPS origin address" };
  }
  return { ok: true, value: parsed.data };
}

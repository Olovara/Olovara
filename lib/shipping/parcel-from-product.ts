import { ParcelSchema } from "@/lib/shipping-carriers/types";
import type { Parcel } from "@/lib/shipping-carriers/types";

function normalizeWeightUnit(
  u: string | null | undefined,
): "oz" | "lb" | "g" | "kg" {
  const v = (u || "lb").toLowerCase();
  if (v === "oz" || v === "lb" || v === "g" || v === "kg") return v;
  return "lb";
}

function normalizeDimensionUnit(u: string | null | undefined): "in" | "cm" {
  const v = (u || "in").toLowerCase();
  if (v === "in" || v === "cm") return v;
  return "in";
}

export type ProductParcelSource = {
  itemWeight: number | null;
  itemWeightUnit: string;
  itemLength: number | null;
  itemWidth: number | null;
  itemHeight: number | null;
  itemDimensionUnit: string;
};

/**
 * One parcel per unit (same weight/dims). Quantity > 1 yields multiple parcels for aggregator/providers that expect that.
 * Falls back to 1 lb if weight missing — sellers should set real weight for accurate USPS pricing.
 */
export function calculateParcelsFromProduct(
  product: ProductParcelSource,
  quantity: number,
): Parcel[] {
  const weightValue = product.itemWeight ?? 1;
  const weightUnit = normalizeWeightUnit(product.itemWeightUnit);

  const dimsProvided =
    product.itemLength && product.itemWidth && product.itemHeight;

  const baseParcel = {
    weight: { value: weightValue, unit: weightUnit },
    ...(dimsProvided
      ? {
          dimensions: {
            length: product.itemLength!,
            width: product.itemWidth!,
            height: product.itemHeight!,
            unit: normalizeDimensionUnit(product.itemDimensionUnit),
          },
        }
      : {}),
  };

  return Array.from({ length: quantity }, () => ParcelSchema.parse(baseParcel));
}

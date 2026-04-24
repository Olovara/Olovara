import { db } from "@/lib/db";
import { getCountryByCode } from "@/data/countries";
import {
  calculateShippingCost,
  type ShippingCalculation,
} from "@/lib/shipping-calculator";
import { convertCurrencyAmount } from "@/lib/currency-convert";

/**
 * Computes shipping in **submission currency** minor units for final custom-order checkout,
 * using the seller's shipping profile and the buyer's destination country.
 */
export async function computeCustomOrderFinalShippingMinor(params: {
  shippingOptionId: string;
  sellerUserId: string;
  destinationCountry: string;
  submissionCurrency: string;
}): Promise<{ shippingMinor: number } | { error: string }> {
  const opt = await db.shippingOption.findFirst({
    where: { id: params.shippingOptionId, sellerId: params.sellerUserId },
    include: { rates: true },
  });

  if (!opt) {
    return { error: "Shipping profile not found" };
  }

  const shippingRates: ShippingCalculation[] = opt.rates.map((rate) => {
    let zoneValue = rate.zone;
    if (!zoneValue && rate.countryCode) {
      const country = getCountryByCode(rate.countryCode);
      zoneValue = country?.zone || "NORTH_AMERICA";
    }
    return {
      zone: zoneValue || "NORTH_AMERICA",
      price: rate.price,
      currency: opt.defaultShippingCurrency || "USD",
      additionalItem: rate.additionalItem,
      isFreeShipping: rate.isFreeShipping,
      type: (rate.type || "zone") as "zone" | "country",
      countryCode: rate.countryCode || undefined,
    };
  });

  const calc = calculateShippingCost(
    shippingRates,
    opt.countryOfOrigin,
    params.destinationCountry.trim().toUpperCase(),
    1,
    opt.defaultShipping ?? null,
    opt.defaultShippingCurrency || "USD",
  );

  if (!calc) {
    return {
      error: "No shipping rate available for this destination. Try another profile or contact the seller.",
    };
  }

  if (calc.isFreeShipping) {
    return { shippingMinor: 0 };
  }

  let shippingMinor = calc.price;
  const shipCur = (
    calc.currency ||
    opt.defaultShippingCurrency ||
    "USD"
  ).toUpperCase();
  const targetCur = params.submissionCurrency.trim().toUpperCase();

  if (shipCur !== targetCur) {
    try {
      shippingMinor = await convertCurrencyAmount(
        shippingMinor,
        shipCur,
        targetCur,
        true,
      );
    } catch {
      return { error: "Could not convert shipping to order currency" };
    }
  }

  return { shippingMinor };
}

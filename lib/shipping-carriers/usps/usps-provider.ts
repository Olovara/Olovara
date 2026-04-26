import type { ShippingProvider } from "../provider";
import type { BuyLabelRequest, BuyLabelResponse, RateRequest, ShippingRate } from "../types";
import { USPSClient } from "./usps-client";

/**
 * Uses **marketplace** USPS API credentials from env (`USPS_CLIENT_ID` / `USPS_CLIENT_SECRET`).
 * Seller `shipFrom` is only the postal origin; postage is billed to your USPS account, not the seller’s.
 */
function normalizeCurrency(code: string): string {
  return code.trim().toUpperCase();
}

function toOz(weight: { value: number; unit: "oz" | "lb" | "g" | "kg" }): number {
  switch (weight.unit) {
    case "oz":
      return weight.value;
    case "lb":
      return weight.value * 16;
    case "g":
      return weight.value / 28.349523125;
    case "kg":
      return (weight.value * 1000) / 28.349523125;
  }
}

/**
 * USPS "modern" API notes (2026):
 * - Base URL production: https://apis.usps.com
 * - Token: POST /oauth2/v3/token (client_credentials)
 * - Domestic rates: POST /prices/v3/base-rates/search
 * - International rates: POST /international-prices/v3/base-rates-list/search
 *
 * This adapter is intentionally minimal and defensive: USPS responses differ by product/service.
 */
export function createUSPSProviderFromEnv(): ShippingProvider | null {
  const clientId = process.env.USPS_CLIENT_ID?.trim();
  const clientSecret = process.env.USPS_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  const env = (process.env.USPS_ENV || "production").trim().toLowerCase();
  const baseUrl =
    env === "test" || env === "sandbox" || env === "tem"
      ? "https://apis-tem.usps.com"
      : "https://apis.usps.com";

  const client = new USPSClient({ baseUrl, clientId, clientSecret });

  const provider: ShippingProvider = {
    id: "usps",
    displayName: "USPS",
    carriers: ["USPS"],

    async getRates(req: RateRequest): Promise<ShippingRate[]> {
      const currency = normalizeCurrency(req.currency);

      // USPS expects one package per request in many examples. We start with the first parcel.
      const parcel = req.parcels[0];
      const weightOz = toOz(parcel.weight);

      const isDomestic =
        req.shipFrom.country.trim().toUpperCase() ===
        req.shipTo.country.trim().toUpperCase();

      if (currency !== "USD") {
        // USPS APIs generally price in USD. You already have currency conversion elsewhere.
        // We return USD and let the caller convert if needed.
      }

      if (isDomestic) {
        const payload: Record<string, unknown> = {
          // Very common fields; exact shape may vary by USPS product.
          originZIPCode: req.shipFrom.postalCode,
          destinationZIPCode: req.shipTo.postalCode,
          weight: weightOz,
          weightUOM: "OZ",
          // Optional: dimensions if present
          ...(parcel.dimensions
            ? {
                length: parcel.dimensions.length,
                width: parcel.dimensions.width,
                height: parcel.dimensions.height,
                dimensionUOM: parcel.dimensions.unit.toUpperCase(),
              }
            : {}),
        };

        const json = await client.requestJson<any>("/prices/v3/base-rates/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const rates: ShippingRate[] = [];

        const items: any[] =
          json?.rates ||
          json?.rateOptions ||
          json?.priceOptions ||
          json?.prices ||
          [];

        for (const r of items) {
          const amount = r?.totalBasePrice ?? r?.totalPrice ?? r?.price ?? r?.amount;
          if (amount === undefined || amount === null) continue;

          const amountMinor = Math.round(Number(amount) * 100);
          if (!Number.isFinite(amountMinor)) continue;

          rates.push({
            provider: "usps",
            carrier: "USPS",
            serviceCode: String(r?.productId ?? r?.productCode ?? r?.serviceCode ?? r?.mailClass ?? "UNKNOWN"),
            serviceName: String(r?.productName ?? r?.serviceName ?? r?.mailClass ?? "USPS Service"),
            rateType: "list",
            total: { currency: "USD", amountMinor },
            deliveryDays:
              typeof r?.deliveryDays === "number"
                ? r.deliveryDays
                : typeof r?.expectedDeliveryDays === "number"
                  ? r.expectedDeliveryDays
                  : undefined,
            raw: r,
          });
        }

        return rates;
      }

      // International
      const payload: Record<string, unknown> = {
        originCountryCode: req.shipFrom.country,
        destinationCountryCode: req.shipTo.country,
        weight: weightOz,
        weightUOM: "OZ",
      };

      const json = await client.requestJson<any>(
        "/international-prices/v3/base-rates-list/search",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const rates: ShippingRate[] = [];
      const items: any[] =
        json?.rates ||
        json?.rateOptions ||
        json?.priceOptions ||
        json?.prices ||
        [];

      for (const r of items) {
        const amount = r?.totalBasePrice ?? r?.totalPrice ?? r?.price ?? r?.amount;
        if (amount === undefined || amount === null) continue;

        const amountMinor = Math.round(Number(amount) * 100);
        if (!Number.isFinite(amountMinor)) continue;

        rates.push({
          provider: "usps",
          carrier: "USPS",
          serviceCode: String(r?.productId ?? r?.productCode ?? r?.serviceCode ?? r?.mailClass ?? "UNKNOWN"),
          serviceName: String(r?.productName ?? r?.serviceName ?? r?.mailClass ?? "USPS Intl Service"),
          rateType: "list",
          total: { currency: "USD", amountMinor },
          raw: r,
        });
      }

      return rates;
    },

    async buyLabel(req: BuyLabelRequest): Promise<BuyLabelResponse> {
      // USPS labels API is more involved (sender/recipient validation, package details, payment account, etc).
      // We ship a stub that fails loudly until we implement your exact label workflow.
      // This is deliberate: buying postage is a money-moving operation and needs strict validation.
      throw new Error(
        "USPS label purchase not wired yet. Next step: implement /labels/v3 flow for your chosen USPS label product + account/payment configuration.",
      );
    },
  };

  return provider;
}


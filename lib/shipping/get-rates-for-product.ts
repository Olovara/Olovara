import { db } from "@/lib/db";
import { createShippingAggregator } from "@/lib/shipping-carriers";
import type { Address, ShippingRate } from "@/lib/shipping-carriers/types";
import { RateRequestSchema } from "@/lib/shipping-carriers/types";
import { calculateParcelsFromProduct } from "@/lib/shipping/parcel-from-product";

export type ListProvidersRow = {
  id: string;
  displayName: string;
  carriers: string[];
};

export type GetRatesForProductResult =
  | {
      success: true;
      rates: ShippingRate[];
      providers: ListProvidersRow[];
    }
  | { success: false; error: string; status: number };

/**
 * Live carrier rates for checkout: `from` = seller USPS origin (when integration on) or default shop address; `to` = buyer.
 * Postage is always requested with **your** USPS credentials (`USPS_CLIENT_*`); sellers never see your client secret.
 */
export async function getRatesForProductCheckout(params: {
  productId: string;
  buyerAddress: Address;
  quantity?: number;
  /** Optional override (admin / internal tools). */
  shipFromOverride?: Address;
  currency?: string;
  allowedCarriers?: string[];
  allowedServices?: string[];
  maxDeliveryDays?: number;
}): Promise<GetRatesForProductResult> {
  const quantity = params.quantity ?? 1;

  const product = await db.product.findUnique({
    where: { id: params.productId },
    select: {
      id: true,
      isDigital: true,
      currency: true,
      shippingMode: true,
      shippingCarrier: true,
      itemWeight: true,
      itemWeightUnit: true,
      itemLength: true,
      itemWidth: true,
      itemHeight: true,
      itemDimensionUnit: true,
      seller: {
        select: {
          addresses: {
            where: { isDefault: true },
            select: {
              encryptedCountry: true,
              countryIV: true,
              countrySalt: true,
              encryptedStreet: true,
              streetIV: true,
              streetSalt: true,
              encryptedStreet2: true,
              street2IV: true,
              street2Salt: true,
              encryptedCity: true,
              cityIV: true,
              citySalt: true,
              encryptedState: true,
              stateIV: true,
              stateSalt: true,
              encryptedPostal: true,
              postalIV: true,
              postalSalt: true,
              isBusinessAddress: true,
            },
          },
        },
      },
    },
  });

  if (!product) {
    return { success: false, error: "Product not found", status: 404 };
  }

  if (product.isDigital) {
    const agg = createShippingAggregator();
    return {
      success: true,
      rates: [],
      providers: agg.listProviders(),
    };
  }

  let shipFrom: Address | undefined = params.shipFromOverride;

  if (!shipFrom) {
    const addr = product.seller?.addresses?.[0];
    if (!addr) {
      return {
        success: false,
        error: "Seller shipping origin address not configured",
        status: 400,
      };
    }

    // If product is set to AUTO_CARRIER, enforce that the default address is a business address.
    if (product.shippingMode === "AUTO_CARRIER") {
      if (!addr.isBusinessAddress) {
        return {
          success: false,
          error:
            "Carrier auto-shipping requires a default business address. Please add/mark a business address in your seller profile.",
          status: 400,
        };
      }
    }

    const { decryptOrderData } = await import("@/lib/encryption");
    shipFrom = {
      line1: decryptOrderData(addr.encryptedStreet, addr.streetIV, addr.streetSalt),
      line2: addr.encryptedStreet2 && addr.street2IV && addr.street2Salt
        ? decryptOrderData(addr.encryptedStreet2, addr.street2IV, addr.street2Salt)
        : undefined,
      city: decryptOrderData(addr.encryptedCity, addr.cityIV, addr.citySalt),
      state:
        addr.encryptedState && addr.stateIV && addr.stateSalt
          ? decryptOrderData(addr.encryptedState, addr.stateIV, addr.stateSalt)
          : undefined,
      postalCode: decryptOrderData(addr.encryptedPostal, addr.postalIV, addr.postalSalt),
      country: decryptOrderData(addr.encryptedCountry, addr.countryIV, addr.countrySalt),
    };
  }

  const parcels = calculateParcelsFromProduct(product, quantity);

  const agg = createShippingAggregator();
  const rateReq = RateRequestSchema.parse({
    shipFrom,
    shipTo: params.buyerAddress,
    parcels,
    currency: params.currency || product.currency || "USD",
    allowedCarriers:
      params.allowedCarriers ??
      (product.shippingMode === "AUTO_CARRIER" && product.shippingCarrier
        ? [product.shippingCarrier]
        : undefined),
    allowedServices: params.allowedServices,
    maxDeliveryDays: params.maxDeliveryDays,
  });

  const rates = await agg.getRates(rateReq);
  return {
    success: true,
    rates,
    providers: agg.listProviders(),
  };
}

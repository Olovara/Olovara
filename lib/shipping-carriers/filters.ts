import type { ShippingRate } from "./types";

export function filterRates(
  rates: ShippingRate[],
  opts: {
    allowedCarriers?: string[];
    allowedServices?: string[];
    maxDeliveryDays?: number;
  },
): ShippingRate[] {
  let out = [...rates];

  if (opts.allowedCarriers?.length) {
    const allowed = new Set(opts.allowedCarriers.map((c) => c.toLowerCase()));
    out = out.filter((r) => allowed.has(r.carrier.toLowerCase()));
  }

  if (opts.allowedServices?.length) {
    const allowed = new Set(opts.allowedServices.map((s) => s.toLowerCase()));
    out = out.filter(
      (r) =>
        allowed.has(r.serviceCode.toLowerCase()) ||
        allowed.has(r.serviceName.toLowerCase()),
    );
  }

  if (typeof opts.maxDeliveryDays === "number") {
    out = out.filter(
      (r) => r.deliveryDays === undefined || r.deliveryDays <= opts.maxDeliveryDays!,
    );
  }

  // Deterministic sorting: cheapest first, then fastest.
  out.sort((a, b) => {
    if (a.total.amountMinor !== b.total.amountMinor) {
      return a.total.amountMinor - b.total.amountMinor;
    }
    const ad = a.deliveryDays ?? Number.POSITIVE_INFINITY;
    const bd = b.deliveryDays ?? Number.POSITIVE_INFINITY;
    return ad - bd;
  });

  return out;
}


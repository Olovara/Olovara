import { ShippingAggregator } from "./aggregator";
import type { ShippingProvider } from "./provider";
import { createUSPSProviderFromEnv } from "./usps/usps-provider";

export function createShippingAggregator(): ShippingAggregator {
  const providers: ShippingProvider[] = [];

  const usps = createUSPSProviderFromEnv();
  if (usps) providers.push(usps);

  return new ShippingAggregator(providers);
}


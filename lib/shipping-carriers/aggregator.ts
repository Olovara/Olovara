import type { ShippingProvider } from "./provider";
import type {
  BuyLabelRequest,
  BuyLabelResponse,
  RateRequest,
  ShippingRate,
} from "./types";
import { filterRates } from "./filters";

export class ShippingAggregator {
  private providersById: Map<string, ShippingProvider>;

  constructor(providers: ShippingProvider[]) {
    this.providersById = new Map(providers.map((p) => [p.id.toLowerCase(), p]));
  }

  listProviders(): { id: string; displayName: string; carriers: string[] }[] {
    return Array.from(this.providersById.values()).map((p) => ({
      id: p.id,
      displayName: p.displayName,
      carriers: p.carriers,
    }));
  }

  getProvider(id: string): ShippingProvider | undefined {
    return this.providersById.get(id.toLowerCase());
  }

  async getRates(req: RateRequest): Promise<ShippingRate[]> {
    const providers = Array.from(this.providersById.values());
    const settled = await Promise.allSettled(
      providers.map((p) => p.getRates(req)),
    );

    const allRates: ShippingRate[] = [];
    for (const s of settled) {
      if (s.status === "fulfilled") allRates.push(...s.value);
    }

    return filterRates(allRates, {
      allowedCarriers: req.allowedCarriers,
      allowedServices: req.allowedServices,
      maxDeliveryDays: req.maxDeliveryDays,
    });
  }

  async buyLabel(req: BuyLabelRequest): Promise<BuyLabelResponse> {
    const provider = this.getProvider(req.provider);
    if (!provider) {
      throw new Error(`Unknown shipping provider: ${req.provider}`);
    }
    return provider.buyLabel(req);
  }
}

import type { BuyLabelRequest, BuyLabelResponse, RateRequest, ShippingRate } from "./types";

export type ProviderId = "usps" | (string & {});

export interface ShippingProvider {
  id: ProviderId;
  displayName: string;
  carriers: string[]; // e.g. ["USPS"]

  getRates(req: RateRequest): Promise<ShippingRate[]>;
  buyLabel(req: BuyLabelRequest): Promise<BuyLabelResponse>;
}


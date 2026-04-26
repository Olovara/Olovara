import { NextResponse } from "next/server";
import { z } from "zod";
import { logError } from "@/lib/error-logger";
import { getRatesForProductCheckout } from "@/lib/shipping/get-rates-for-product";
import { AddressSchema } from "@/lib/shipping-carriers/types";

export const dynamic = "force-dynamic";

const RatesBodySchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive().default(1),
  shipTo: AddressSchema,
  shipFrom: AddressSchema.optional(),
  currency: z.string().min(3).max(3).optional(),
  allowedCarriers: z.array(z.string()).optional(),
  allowedServices: z.array(z.string()).optional(),
  maxDeliveryDays: z.number().int().positive().optional(),
});

export async function POST(req: Request) {
  let body: unknown = null;

  try {
    body = await req.json();
    const parsed = RatesBodySchema.parse(body);

    const result = await getRatesForProductCheckout({
      productId: parsed.productId,
      buyerAddress: parsed.shipTo,
      quantity: parsed.quantity,
      shipFromOverride: parsed.shipFrom,
      currency: parsed.currency,
      allowedCarriers: parsed.allowedCarriers,
      allowedServices: parsed.allowedServices,
      maxDeliveryDays: parsed.maxDeliveryDays,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      rates: result.rates,
      providers: result.providers,
    });
  } catch (error) {
    console.error("[shipping/rates] error", error);
    const userMessage = logError({
      code: "SHIPPING_RATES_FAILED",
      route: "/api/shipping/rates",
      method: "POST",
      error,
      metadata: {
        hasBody: !!body,
      },
    });
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

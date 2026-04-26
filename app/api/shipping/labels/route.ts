import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { logError } from "@/lib/error-logger";
import { createShippingAggregator } from "@/lib/shipping-carriers";
import { BuyLabelRequestSchema } from "@/lib/shipping-carriers/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    body = await req.json();
    const parsed = BuyLabelRequestSchema.parse(body);

    const agg = createShippingAggregator();
    const label = await agg.buyLabel(parsed);

    return NextResponse.json(label);
  } catch (error) {
    console.error("[shipping/labels] error", error);
    const userMessage = logError({
      code: "SHIPPING_LABEL_BUY_FAILED",
      userId: session?.user?.id,
      route: "/api/shipping/labels",
      method: "POST",
      error,
      metadata: {
        provider: body?.provider,
        carrier: body?.carrier,
        serviceCode: body?.serviceCode,
      },
    });
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}


import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";


export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")!;
  const rawBody = await req.text();

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const { productId, buyerId, sellerId, quantity, totalAmount } = session.metadata;

    try {
      await prisma.order.create({
        data: {
          buyerId,
          sellerId,
          productId,
          quantity: Number(quantity),
          totalAmount: Number(totalAmount),
          paymentStatus: "PAID",
          orderStatus: "PROCESSING",
        },
      });

      console.log(`Order created: Buyer ${buyerId} purchased ${quantity} of product ${productId}`);
    } catch (error) {
      console.error("Order Creation Error:", error);
    }
  }

  return NextResponse.json({ received: true });
}

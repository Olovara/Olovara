import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const rawBody = await req.arrayBuffer();
  const sig = headers().get("stripe-signature") as string;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      Buffer.from(rawBody),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("❌ Stripe Webhook Error:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle only successful payment events
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;

    const orderId = session.metadata?.orderId;
    const quantity = parseInt(session.metadata?.quantity || "1", 10);
    const isDigital = session.metadata?.isDigital === "true";

    try {
      // 1. Fetch the order + product + seller
      const order = await db.order.findUnique({
        where: { id: orderId },
        include: { product: true },
      });

      if (!order || !order.productId) throw new Error("Order not found");

      // 2. Update product and seller stats
      await db.product.update({
        where: { id: order.productId },
        data: {
          numberSold: { increment: quantity },
        },
      });

      await db.seller.update({
        where: { id: order.sellerId },
        data: {
          totalSales: { increment: quantity },
        },
      });

      // 3. Update order with buyerName, productName, shipping address, and mark as PAID
      await db.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          status: "PROCESSING",
          buyerName: session.customer_details?.name || null,
          productName: order.product.name,
          // Save shipping address for physical products
          ...(isDigital ? {} : {
            shippingAddress: session.shipping_details?.address || null,
          }),
        },
      });
    } catch (err: any) {
      console.error("🔥 Webhook handling failed:", err.message);
      return new NextResponse("Webhook internal error", { status: 500 });
    }
  }

  return new NextResponse("Webhook received", { status: 200 });
}

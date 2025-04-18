import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { headers } from "next/headers";

// Remove edge runtime to avoid potential issues
// export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  console.log("🔔 Webhook received");
  
  const rawBody = await req.arrayBuffer();
  const sig = headers().get("stripe-signature") as string;

  if (!sig) {
    console.error("❌ No Stripe signature found in request");
    return new NextResponse("No signature", { status: 400 });
  }

  // Use the correct environment variable name
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_SECRET_WEBHOOK;
  
  if (!webhookSecret) {
    console.error("❌ No webhook secret found in environment variables");
    return new NextResponse("Server configuration error", { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      Buffer.from(rawBody),
      sig,
      webhookSecret
    );
    console.log(`✅ Webhook verified: ${event.type}`);
  } catch (err: any) {
    console.error("❌ Stripe Webhook Error:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle only successful payment events
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const sessionId = session.id;
    console.log(`💰 Processing checkout.session.completed for session: ${sessionId}`);

    try {
      // 1. Find the order by stripeSessionId
      const order = await db.order.findFirst({
        where: { stripeSessionId: sessionId },
        include: { product: true },
      });

      if (!order) {
        console.error(`❌ Order not found for session: ${sessionId}`);
        return new NextResponse("Order not found", { status: 404 });
      }

      console.log(`✅ Found order: ${order.id}, current status: ${order.status}, payment status: ${order.paymentStatus}`);

      // 2. Update product and seller stats
      await db.product.update({
        where: { id: order.productId },
        data: {
          numberSold: { increment: order.quantity },
        },
      });
      console.log(`✅ Updated product stats for: ${order.productId}`);

      await db.seller.update({
        where: { id: order.sellerId },
        data: {
          totalSales: { increment: order.quantity },
        },
      });
      console.log(`✅ Updated seller stats for: ${order.sellerId}`);

      // 3. Update order with buyerName, productName, shipping address, and mark as PAID
      const updatedOrder = await db.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          status: "PROCESSING",
          buyerName: session.customer_details?.name || null,
          // Save shipping address for physical products
          ...(order.isDigital ? {} : {
            shippingAddress: session.shipping_details?.address || null,
          }),
        },
      });
      console.log(`✅ Updated order: ${updatedOrder.id}, new status: ${updatedOrder.status}, payment status: ${updatedOrder.paymentStatus}`);

      return new NextResponse("Order updated successfully", { status: 200 });
    } catch (err: any) {
      console.error("🔥 Webhook handling failed:", err.message);
      return new NextResponse("Webhook internal error", { status: 500 });
    }
  }

  return new NextResponse("Webhook received", { status: 200 });
}

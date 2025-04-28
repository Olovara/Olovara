import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import type { Stripe } from "stripe";
import { OrderStatus, PaymentStatus } from "@prisma/client";

// Remove edge runtime to avoid potential issues
// export const runtime = 'edge';
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  console.log("🔔 Webhook received");

  const rawBody = await req.arrayBuffer();
  const sig = headers().get("stripe-signature") as string;

  if (!sig) {
    console.error("❌ No Stripe signature found in request");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("❌ No webhook secret found in environment variables");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
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
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`✅ Processing checkout.session.completed: ${session.id}`);

        if (!session.payment_intent) {
          console.error("❌ Session completed without Payment Intent ID");
          throw new Error("Payment Intent ID missing");
        }

        if (!session.metadata) {
          console.error("❌ Session completed without metadata");
          throw new Error("Metadata missing from session");
        }

        // Fetch product details using metadata
        const product = await db.product.findUnique({
          where: { id: session.metadata.productId },
          include: { seller: true },
        });

        if (!product || !product.seller?.connectedAccountId) {
          console.error("❌ Product, Seller or Seller Connection not found for session:", session.id);
          throw new Error("Product/Seller details missing or incomplete");
        }

        // Create preliminary order
        const preliminaryOrderData = {
          userId: session.metadata.userId || "",
          buyerEmail: session.customer_details?.email || "",
          buyerName: session.customer_details?.name || "",
          sellerId: session.metadata.sellerId || "",
          shopName: product.seller?.shopName || "",
          productId: session.metadata.productId || "",
          productName: product.name,
          quantity: parseInt(session.metadata.quantity || "1"),
          // Amounts are already in cents from metadata
          totalAmount: parseInt(session.metadata.productPrice || "0") + parseInt(session.metadata.shippingAndHandling || "0"),
          productPrice: parseInt(session.metadata.productPrice || "0"),
          shippingCost: parseInt(session.metadata.shippingAndHandling || "0"),
          stripeFee: 0, // Placeholder
          isDigital: product.isDigital || false,
          // Set initial status based on product type
          status: product.isDigital ? OrderStatus.COMPLETED : OrderStatus.PENDING_TRANSFER,
          paymentStatus: PaymentStatus.PAID,
          stripeSessionId: session.id,
          stripeTransferId: null,
          shippingAddress: session.shipping_details?.address
            ? {
                city: session.shipping_details.address.city || "",
                country: session.shipping_details.address.country || "",
                line1: session.shipping_details.address.line1 || "",
                line2: session.shipping_details.address.line2 || "",
                postal_code: session.shipping_details.address.postal_code || "",
                state: session.shipping_details.address.state || "",
              }
            : null,
          discount: null,
          completedAt: product.isDigital ? new Date() : null,
        };

        const order = await db.order.create({ data: preliminaryOrderData });
        console.log(`✅ Created preliminary order: ${order.id}`);

        // Retrieve Charge and Balance Transaction to get the exact fee
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
        if (!paymentIntent.latest_charge) throw new Error("Charge ID missing from Payment Intent");

        let charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string);

        // Check charge status - should be succeeded
        if (charge.status !== 'succeeded') {
          console.error(`❌ Charge ${charge.id} status is ${charge.status}, not 'succeeded'. Cannot process transfer yet.`);
          throw new Error(`Charge status is ${charge.status}, cannot get balance transaction.`);
        }

        let balanceTransactionId = charge.balance_transaction as string | null;

        // If balance_transaction ID is missing, try listing balance transactions by source (charge ID)
        if (!balanceTransactionId) {
          console.warn(`⚠️ Charge ${charge.id} status is 'succeeded', but balance_transaction ID initially missing. Trying list fallback.`);
          const btList = await stripe.balanceTransactions.list({
            source: charge.id,
            limit: 1 // We only expect one balance transaction per charge
          });

          if (btList.data.length > 0) {
            balanceTransactionId = btList.data[0].id;
            console.log(`✅ Fallback successful: Found balance transaction ${balanceTransactionId} via list.`);
          } else {
            // Optional: Add a small delay and retry the list once more, as a final check
            console.warn(`⚠️ Fallback list failed for charge ${charge.id}. Waiting 1 second and retrying list.`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            const finalList = await stripe.balanceTransactions.list({ source: charge.id, limit: 1 });
            if (finalList.data.length > 0) {
              balanceTransactionId = finalList.data[0].id;
              console.log(`✅ Fallback successful on retry: Found balance transaction ${balanceTransactionId} via list.`);
            } else {
              console.error(`❌ Fallback failed again: No balance transaction found via list for charge ${charge.id}.`);
              throw new Error("Balance Transaction ID missing and list fallback failed");
            }
          }
        }

        // Ensure we have the ID before proceeding
        if (!balanceTransactionId) {
          // Should not happen if the logic above worked, but as a safeguard:
          throw new Error("Could not retrieve Balance Transaction ID");
        }

        // Retrieve the Balance Transaction using the obtained ID
        const balanceTransaction = await stripe.balanceTransactions.retrieve(balanceTransactionId);
        const stripeFee = balanceTransaction.fee; // Actual fee in cents
        console.log(`💰 Stripe fee from balance transaction: ${stripeFee} cents`);

        // Update order with Stripe fee (store in cents)
        await db.order.update({
          where: { id: order.id },
          data: { stripeFee: stripeFee }, // Store fee in cents
        });

        // Get amounts from metadata (already in cents)
        const totalAmountInCents = order.totalAmount;
        const platformFeeInCents = parseInt(session.metadata.platformFee || "0");

        // Calculate amount to transfer (ensure at least 1 cent)
        const amountToSeller = Math.max(1,
          totalAmountInCents
          - stripeFee           // Stripe fee in cents
          - platformFeeInCents  // Your fee in cents
        );

        console.log(`💰 Transfer calculation (in cents):`);
        console.log(`- Total amount: ${totalAmountInCents}`);
        console.log(`- Stripe fee: ${stripeFee}`);
        console.log(`- Platform fee: ${platformFeeInCents}`);
        console.log(`- Amount to seller: ${amountToSeller}`);

        // Create transfer to seller
        const transfer = await stripe.transfers.create({
          amount: amountToSeller,
          currency: "usd",
          destination: product.seller.connectedAccountId,
          transfer_group: session.payment_intent as string,
          source_transaction: charge.id,
          metadata: {
            orderId: order.id,
            sessionId: session.id,
          }
        });
        console.log(`💰 Created transfer to seller: ${transfer.id}`);

        // Update order with transfer ID and finalize status
        await db.order.update({
          where: { id: order.id },
          data: {
            stripeTransferId: transfer.id,
            status: OrderStatus.COMPLETED,
            paymentStatus: PaymentStatus.PAID,
            completedAt: new Date(),
          },
        });

        // Update product/seller stats
        try {
          // Update product stats
          await db.product.update({
            where: { id: session.metadata.productId },
            data: {
              numberSold: {
                increment: parseInt(session.metadata.quantity || "1"),
              },
              // Only reduce stock if it's a physical product
              ...(product.isDigital === false && {
                stock: {
                  decrement: parseInt(session.metadata.quantity || "1"),
                },
              }),
            },
          });

          // Update seller stats
          await db.seller.update({
            where: { id: session.metadata.sellerId },
            data: {
              totalSales: {
                increment: parseInt(session.metadata.quantity || "1"),
              },
            },
          });

          console.log(`✅ Updated product and seller stats for order ${order.id}`);
        } catch (statsError) {
          console.error("⚠️ Error updating product/seller stats:", statsError);
        }

        return NextResponse.json({ success: true, orderId: order.id });
      }
      case "charge.succeeded": {
        // Just log this event
        const charge = event.data.object as Stripe.Charge;
        console.log(`💰 Charge succeeded: ${charge.id}, PI: ${charge.payment_intent}`);
        return NextResponse.json({ received: true });
      }
      default: {
        console.log(`🤷 Unhandled event type: ${event.type}`);
        return NextResponse.json({ success: true, message: "Event type not handled" });
      }
    }
  } catch (error: any) {
    console.error("❌ Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed", message: error.message },
      { status: 500 }
    );
  }
}

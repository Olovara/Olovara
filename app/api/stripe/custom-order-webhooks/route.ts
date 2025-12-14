import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripeWebhook } from "@/lib/stripe";
import { db } from "@/lib/db";
import type { Stripe } from "stripe";
import { calculateCommissionRate } from "@/lib/feeConfig";
import { logError } from "@/lib/error-logger";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripeWebhook.instance.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (error: unknown) {
    console.error("Webhook signature verification failed:", error);
    return new Response("Webhook signature verification failed", {
      status: 400,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(
          `✅ Processing custom order checkout.session.completed: ${session.id}`
        );

        if (!session.payment_intent || !session.metadata) {
          console.error(
            "❌ Session completed without Payment Intent ID or metadata"
          );
          throw new Error("Payment Intent ID or metadata missing");
        }

        const { submissionId, paymentType } = session.metadata;

        if (!submissionId || !paymentType) {
          console.error("❌ Missing submissionId or paymentType in metadata");
          throw new Error("Missing required metadata");
        }

        // Fetch submission details
        const submission = await db.customOrderSubmission.findUnique({
          where: { id: submissionId },
          include: {
            form: {
              include: {
                seller: {
                  select: {
                    id: true,
                    userId: true,
                    shopName: true,
                    isFoundingSeller: true,
                    hasCommissionDiscount: true,
                    commissionDiscountExpiresAt: true,
                  },
                },
              },
            },
          },
        });

        if (!submission) {
          console.error("❌ Submission not found:", submissionId);
          throw new Error("Submission not found");
        }

        // Get payment details from Stripe
        const paymentIntent =
          await stripeWebhook.instance.paymentIntents.retrieve(
            session.payment_intent as string
          );
        if (!paymentIntent.latest_charge) {
          throw new Error("Charge ID missing from Payment Intent");
        }

        const charge = await stripeWebhook.instance.charges.retrieve(
          paymentIntent.latest_charge as string
        );
        if (charge.status !== "succeeded") {
          console.error(
            `❌ Charge ${charge.id} status is ${charge.status}, not 'succeeded'`
          );
          throw new Error(`Charge status is ${charge.status}`);
        }

        // Calculate dynamic commission rate based on seller status and discount eligibility
        const commissionRate = calculateCommissionRate(
          submission.form.seller?.isFoundingSeller || false,
          submission.form.seller?.hasCommissionDiscount || false,
          submission.form.seller?.commissionDiscountExpiresAt || null
        );

        // Calculate platform fee and seller amount
        const amount = session.amount_total || 0;
        const platformFee = Math.round(amount * (commissionRate / 100));
        const sellerAmount = amount - platformFee;

        // Create payment record
        const payment = await db.customOrderPayment.create({
          data: {
            submissionId,
            paymentType,
            amount,
            currency: session.currency || "USD",
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string,
            status: "COMPLETED",
            platformFee,
            sellerAmount,
            taxAmount: session.total_details?.amount_tax || 0,
            taxJurisdiction: session.customer_details?.address?.country || null,
            taxRate: session.total_details?.amount_tax
              ? session.total_details.amount_tax / (session.amount_total || 1)
              : null,
            taxType: session.total_details?.amount_tax ? "VAT" : null,
          },
        });

        // Update submission payment status
        const updateData: any = {};

        if (paymentType === "MATERIALS_DEPOSIT") {
          updateData.materialsDepositPaid = true;
          updateData.status = "APPROVED"; // Move to approved status after materials paid
        } else if (paymentType === "FINAL_PAYMENT") {
          updateData.finalPaymentPaid = true;
          updateData.status = "COMPLETED";

          // Store shipping address if provided
          if (session.shipping_details?.address) {
            const shippingAddress = {
              city: session.shipping_details.address.city || "",
              country: session.shipping_details.address.country || "",
              line1: session.shipping_details.address.line1 || "",
              line2: session.shipping_details.address.line2 || "",
              postal_code: session.shipping_details.address.postal_code || "",
              state: session.shipping_details.address.state || "",
            };

            // For now, store as JSON (you might want to encrypt this later)
            updateData.shippingAddress = shippingAddress;
          }
        }

        await db.customOrderSubmission.update({
          where: { id: submissionId },
          data: updateData,
        });

        console.log(`✅ Custom order payment processed: ${payment.id}`);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`❌ Payment failed for custom order: ${paymentIntent.id}`);

        // Update payment record status if it exists
        if (paymentIntent.metadata?.submissionId) {
          await db.customOrderPayment.updateMany({
            where: {
              stripePaymentIntentId: paymentIntent.id,
              status: "PENDING",
            },
            data: { status: "FAILED" },
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error processing custom order webhook:", error);

    // Log to database - webhook processing failures are critical
    const userMessage = logError({
      code: "CUSTOM_ORDER_WEBHOOK_PROCESSING_FAILED",
      userId: null, // Webhook doesn't have user context
      route: "/api/stripe/custom-order-webhooks",
      method: "POST",
      error,
      metadata: {
        eventType: (error as any)?.type || "unknown",
        note: "Failed to process custom order webhook",
      },
    });

    return new Response("Webhook processing failed", { status: 500 });
  }
}

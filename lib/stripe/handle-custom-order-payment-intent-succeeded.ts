import { NextResponse } from "next/server";
import type Stripe from "stripe";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { stripeSecret } from "@/lib/stripe";
import { decryptOrderData } from "@/lib/encryption";
import { createCustomFulfillmentOrderIfNeeded } from "@/lib/orders/create-custom-fulfillment-order";

type DraftPayload = {
  shipping?: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    postal?: string;
    country?: string;
  };
};

/**
 * Retrieves Stripe processing fee (cents) for a charge, with retries while balance_transaction loads.
 */
async function getStripeFeeCents(chargeId: string): Promise<number> {
  let stripeFee = 0;
  for (let attempt = 1; attempt <= 5; attempt++) {
    const charge = await stripeSecret.instance.charges.retrieve(chargeId, {
      expand: ["balance_transaction"],
    });
    const bt = charge.balance_transaction;
    if (bt && typeof bt !== "string") {
      stripeFee = bt.fee;
      break;
    }
    if (bt && typeof bt === "string") {
      try {
        const balanceTransaction =
          await stripeSecret.instance.balanceTransactions.retrieve(bt);
        stripeFee = balanceTransaction.fee;
        break;
      } catch {
        /* retry */
      }
    }
    await new Promise((r) => setTimeout(r, attempt * 750));
  }
  if (!stripeFee || stripeFee <= 0) {
    try {
      const btList = await stripeSecret.instance.balanceTransactions.list({
        source: chargeId,
        limit: 1,
      });
      if (btList.data.length > 0) {
        stripeFee = btList.data[0].fee;
      }
    } catch {
      /* fall through */
    }
  }
  return stripeFee;
}

/**
 * Marketplace custom-order payments created via Payment Element (on-site checkout).
 * Separate charges + manual transfer to the seller (same economics as product PI checkout).
 */
export async function handleCustomOrderPaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
): Promise<NextResponse> {
  const meta = paymentIntent.metadata;
  const submissionId = meta.customOrderSubmissionId?.trim();
  const paymentType =
    meta.customOrderPaymentType?.trim() || meta.paymentType?.trim();

  if (!submissionId || !paymentType) {
    console.error(
      "[custom-order PI] Missing customOrderSubmissionId or paymentType",
    );
    throw new Error("Invalid custom order payment intent metadata");
  }

  const existing = await db.customOrderPayment.findFirst({
    where: {
      OR: [
        { stripePaymentIntentId: paymentIntent.id },
        { stripeSessionId: paymentIntent.id },
      ],
      status: "COMPLETED",
    },
  });
  if (existing) {
    console.log(
      `♻️ Custom order payment already recorded for PI ${paymentIntent.id}`,
    );
    return NextResponse.json({ success: true, duplicate: true });
  }

  const submission = await db.customOrderSubmission.findUnique({
    where: { id: submissionId },
    include: {
      form: {
        include: {
          seller: {
            select: {
              id: true,
              connectedAccountId: true,
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
    throw new Error("Custom order submission not found");
  }

  if (meta.userId && meta.userId !== submission.userId) {
    throw new Error("Payment user does not match submission owner");
  }

  const seller = submission.form.seller;
  if (!seller?.connectedAccountId) {
    throw new Error("Seller connected account missing");
  }

  const charges = await stripeSecret.instance.charges.list({
    payment_intent: paymentIntent.id,
    limit: 1,
  });
  if (charges.data.length === 0) {
    throw new Error(`No charge for payment intent ${paymentIntent.id}`);
  }
  const chargeId = charges.data[0].id;
  if (charges.data[0].status !== "succeeded") {
    throw new Error(`Charge ${chargeId} not succeeded`);
  }

  let stripeFee = await getStripeFeeCents(chargeId);
  if (!stripeFee || stripeFee <= 0) {
    stripeFee = Math.round(paymentIntent.amount * 0.029 + 30);
    console.warn(
      `[custom-order PI] Estimated Stripe fee for ${paymentIntent.id}: ${stripeFee}`,
    );
  }

  const platformFeeInCents = parseInt(meta.platformFee || "0", 10);
  const amountToSeller = Math.max(
    1,
    paymentIntent.amount - platformFeeInCents - stripeFee,
  );

  const transferParams: Stripe.TransferCreateParams = {
    amount: amountToSeller,
    currency: paymentIntent.currency,
    destination: seller.connectedAccountId,
    transfer_group: paymentIntent.id,
    source_transaction: chargeId,
    metadata: {
      customOrderSubmissionId: submissionId,
      paymentIntentId: paymentIntent.id,
      platformFee: platformFeeInCents.toString(),
      stripeFee: stripeFee.toString(),
    },
  };

  const existingTransfers = await stripeSecret.instance.transfers.list({
    transfer_group: paymentIntent.id,
    limit: 5,
  });
  if (existingTransfers.data.length === 0) {
    await stripeSecret.instance.transfers.create(transferParams);
    console.log(
      `✅ Custom order transfer created for PI ${paymentIntent.id} → ${amountToSeller} ${paymentIntent.currency}`,
    );
  } else {
    console.log(
      `♻️ Transfer already exists for PI ${paymentIntent.id}, skipping create`,
    );
  }

  const amount = paymentIntent.amount;
  const sellerAmountRecorded = amount - platformFeeInCents;

  const payment = await db.customOrderPayment.create({
    data: {
      submissionId,
      paymentType,
      amount,
      currency: (paymentIntent.currency || "usd").toUpperCase(),
      stripeSessionId: paymentIntent.id,
      stripePaymentIntentId: paymentIntent.id,
      status: "COMPLETED",
      platformFee: platformFeeInCents,
      sellerAmount: sellerAmountRecorded,
      taxAmount: 0,
      taxJurisdiction: null,
      taxRate: null,
      taxType: null,
    },
  });

  const updateData: Record<string, unknown> = {};

  if (paymentType === "QUOTE_DEPOSIT" || paymentType === "MATERIALS_DEPOSIT") {
    updateData.quoteDepositPaid = true;
    updateData.status = "PENDING_SELLER_START";
  } else if (paymentType === "FINAL_PAYMENT") {
    updateData.finalPaymentPaid = true;
    updateData.status = "COMPLETED";
    updateData.completedAt = new Date();

    const shipMinorRaw = meta.finalShippingMinor?.trim();
    if (shipMinorRaw) {
      const shipMinor = parseInt(shipMinorRaw, 10);
      if (!Number.isNaN(shipMinor) && shipMinor >= 0) {
        updateData.shippingCost = shipMinor;
      }
    }

    const draftToken = meta.checkoutDraftId?.trim() || "";
    if (draftToken) {
      try {
        const row = await db.checkoutDraft.findUnique({
          where: { draftToken },
        });
        if (row) {
          const json = decryptOrderData(
            row.encryptedPayload,
            row.payloadIV,
            row.payloadSalt,
          );
          const draftPayload = JSON.parse(json) as DraftPayload;
          if (draftPayload.shipping) {
            const s = draftPayload.shipping;
            updateData.shippingAddress = {
              city: s.city || "",
              country: s.country || "",
              line1: s.street || "",
              line2: "",
              postal_code: s.postal || "",
              state: s.state || "",
            };
          }
          await db.checkoutDraft.deleteMany({ where: { id: row.id } });
        }
      } catch (e) {
        console.error("[custom-order PI] Checkout draft load failed:", e);
      }
    }
  }

  await db.customOrderSubmission.update({
    where: { id: submissionId },
    data: updateData as Prisma.CustomOrderSubmissionUpdateInput,
  });

  if (paymentType === "FINAL_PAYMENT") {
    try {
      await createCustomFulfillmentOrderIfNeeded({
        submissionId,
        stripePaymentIntentId: paymentIntent.id,
        platformFeeCents: platformFeeInCents,
      });
    } catch (e) {
      console.error(
        "[custom-order PI] Fulfillment Order create failed:",
        e,
      );
    }
  }

  console.log(`✅ Custom order PI processed: payment ${payment.id}`);

  return NextResponse.json({
    success: true,
    customOrderPaymentId: payment.id,
  });
}

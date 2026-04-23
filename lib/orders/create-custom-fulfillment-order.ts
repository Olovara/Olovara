import type { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { encryptOrderData } from "@/lib/encryption";
import { getDecryptedCustomerContact } from "@/lib/custom-order-submission-contact";

function hasPhysicalShippingAddress(addr: unknown): boolean {
  if (!addr || typeof addr !== "object") return false;
  const a = addr as Record<string, unknown>;
  const line1 = String(a.line1 ?? a.street ?? "").trim();
  return line1.length > 0;
}

function customOrderTotalCents(row: {
  totalAmount: number | null;
  quoteDepositMinor: number | null;
  finalPaymentAmount: number | null;
}): number {
  if (row.totalAmount != null && row.totalAmount > 0) {
    return row.totalAmount;
  }
  const d = row.quoteDepositMinor ?? 0;
  const f = row.finalPaymentAmount ?? 0;
  return d + f;
}

export type CreateCustomFulfillmentOrderInput = {
  submissionId: string;
  /** Stripe PaymentIntent id — also used as `Order.stripeSessionId` (unique). */
  stripePaymentIntentId: string;
  /** Platform fee in cents from the final payment row. */
  platformFeeCents: number;
};

/**
 * Idempotent: creates a marketplace `Order` for a completed custom order (final payment),
 * or returns the existing row linked to this submission or PI.
 */
export async function createCustomFulfillmentOrderIfNeeded(
  input: CreateCustomFulfillmentOrderInput,
): Promise<{ orderId: string; created: boolean }> {
  const existing = await db.order.findFirst({
    where: {
      OR: [
        { customOrderSubmissionId: input.submissionId },
        { stripeSessionId: input.stripePaymentIntentId },
      ],
    },
    select: { id: true },
  });
  if (existing) {
    return { orderId: existing.id, created: false };
  }

  const submission = await db.customOrderSubmission.findUnique({
    where: { id: input.submissionId },
    include: {
      form: {
        select: {
          title: true,
          seller: {
            select: { userId: true, shopName: true },
          },
        },
      },
    },
  });

  if (!submission) {
    throw new Error("Custom order submission not found");
  }

  const contact = getDecryptedCustomerContact(submission);
  const buyerEmail = contact.email || "";
  const buyerName = contact.name?.trim() || "Customer";
  if (!buyerEmail.trim()) {
    throw new Error("Buyer email missing for fulfillment order");
  }

  const { encrypted: encEmail, iv: eIv, salt: eSalt } =
    encryptOrderData(buyerEmail);
  const { encrypted: encName, iv: nIv, salt: nSalt } =
    encryptOrderData(buyerName);

  const shippingSource = submission.shippingAddress;
  const shipStr = hasPhysicalShippingAddress(shippingSource)
    ? JSON.stringify(
        typeof shippingSource === "object" && shippingSource !== null
          ? {
              line1: String(
                (shippingSource as Record<string, unknown>).line1 ?? "",
              ),
              line2: String(
                (shippingSource as Record<string, unknown>).line2 ?? "",
              ),
              city: String(
                (shippingSource as Record<string, unknown>).city ?? "",
              ),
              state: String(
                (shippingSource as Record<string, unknown>).state ?? "",
              ),
              postal_code: String(
                (shippingSource as Record<string, unknown>).postal_code ?? "",
              ),
              country: String(
                (shippingSource as Record<string, unknown>).country ?? "",
              ),
            }
          : shippingSource,
      )
    : null;

  const { encrypted: encShip, iv: sIv, salt: sSalt } = shipStr
    ? encryptOrderData(shipStr)
    : { encrypted: "", iv: "", salt: "" };

  const isDigital = !hasPhysicalShippingAddress(shippingSource);
  const totalCents = customOrderTotalCents(submission);
  const finalMinor = submission.finalPaymentAmount ?? 0;
  const title = submission.form.title.trim() || "Custom order";
  const productName = `${title} (Custom order)`;
  const currency = (submission.currency || "USD").trim().toUpperCase();

  const orderStatus: OrderStatus = isDigital
    ? "COMPLETED"
    : "PAID";
  const now = new Date();
  const paymentStatus: PaymentStatus = "PAID";
  const platformFee = input.platformFeeCents;
  const stripeFeeEst = Math.max(
    0,
    Math.round(totalCents * 0.029 + 30),
  );

  const data: Prisma.OrderCreateInput = {
    user: { connect: { id: submission.userId } },
    encryptedBuyerEmail: encEmail,
    buyerEmailIV: eIv,
    buyerEmailSalt: eSalt,
    encryptedBuyerName: encName,
    buyerNameIV: nIv,
    buyerNameSalt: nSalt,
    seller: { connect: { userId: submission.form.seller.userId } },
    shopName: submission.form.seller.shopName || "Shop",
    productName,
    quantity: 1,
    totalAmount: totalCents,
    currency,
    productPrice: finalMinor > 0 ? finalMinor : totalCents,
    shippingCost: submission.shippingCost ?? 0,
    stripeFee: stripeFeeEst,
    platformFee,
    isDigital,
    customOrderSubmissionId: submission.id,
    status: orderStatus,
    paymentStatus,
    stripeSessionId: input.stripePaymentIntentId,
    stripeTransferId: null,
    encryptedShippingAddress: encShip,
    shippingAddressIV: sIv,
    shippingAddressSalt: sSalt,
    completedAt: isDigital ? now : null,
  };

  const order = await db.order.create({ data });
  return { orderId: order.id, created: true };
}

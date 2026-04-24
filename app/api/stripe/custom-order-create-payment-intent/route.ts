import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripeSecret } from "@/lib/stripe";
import { calculateCommissionRate } from "@/lib/feeConfig";
import { convertCurrencyAmount } from "@/lib/currency-convert";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { logError } from "@/lib/error-logger";
import { getDecryptedCustomerContact } from "@/lib/custom-order-submission-contact";
import { encryptOrderData } from "@/lib/encryption";
import { computeCustomOrderFinalShippingMinor } from "@/lib/custom-order-final-shipping";
import type Stripe from "stripe";
import type { Session } from "next-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let authSession: Session | null = null;
  let body: Record<string, unknown> = {};

  try {
    authSession = await auth();
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    body = await req.json();
    const {
      submissionId,
      paymentType,
      preferredCurrency,
      recaptchaToken,
      idempotencyKey: bodyIdempotencyKey,
      shippingAddress,
      billingAddress,
      sameAsShipping,
    } = body as {
      submissionId?: string;
      paymentType?: string;
      preferredCurrency?: string;
      recaptchaToken?: string;
      idempotencyKey?: string;
      shippingAddress?: {
        name: string;
        street: string;
        city: string;
        state: string;
        postal: string;
        country: string;
      };
      billingAddress?: {
        name: string;
        street: string;
        city: string;
        state: string;
        postal: string;
        country: string;
      };
      sameAsShipping?: boolean;
    };

    const stripeIdempotencyKey =
      (typeof bodyIdempotencyKey === "string" && bodyIdempotencyKey.trim()) ||
      req.headers.get("Idempotency-Key")?.trim() ||
      undefined;

    if (!submissionId || !paymentType) {
      return NextResponse.json(
        { error: "Missing submissionId or paymentType" },
        { status: 400 },
      );
    }

    const recaptchaResult = await verifyRecaptcha(
      recaptchaToken ?? "",
      "checkout",
      0.5,
    );
    if (!recaptchaResult.success) {
      return NextResponse.json(
        {
          error: "Security verification failed. Please try again.",
          details: "reCAPTCHA verification failed",
        },
        { status: 403 },
      );
    }

    const isFinal = paymentType === "FINAL_PAYMENT";
    const isDeposit =
      paymentType === "QUOTE_DEPOSIT" || paymentType === "MATERIALS_DEPOSIT";

    if (!isFinal && !isDeposit) {
      return NextResponse.json({ error: "Invalid payment type" }, { status: 400 });
    }

    if (isFinal) {
      const addr = sameAsShipping ? shippingAddress : billingAddress;
      if (
        !shippingAddress?.name ||
        !shippingAddress?.street ||
        !shippingAddress?.city ||
        !shippingAddress?.state ||
        !shippingAddress?.postal ||
        !shippingAddress?.country
      ) {
        return NextResponse.json(
          { error: "Shipping address is required for final payment" },
          { status: 400 },
        );
      }
      if (
        !sameAsShipping &&
        (!billingAddress?.name ||
          !billingAddress?.street ||
          !billingAddress?.city ||
          !billingAddress?.state ||
          !billingAddress?.postal ||
          !billingAddress?.country)
      ) {
        return NextResponse.json(
          { error: "Billing address is required" },
          { status: 400 },
        );
      }
      if (!addr) {
        return NextResponse.json(
          { error: "Address information is incomplete" },
          { status: 400 },
        );
      }
    }

    const submission = await db.customOrderSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        userId: true,
        status: true,
        customerEmail: true,
        customerName: true,
        encryptedCustomerEmail: true,
        customerEmailIV: true,
        customerEmailSalt: true,
        encryptedCustomerName: true,
        customerNameIV: true,
        customerNameSalt: true,
        quoteDepositMinor: true,
        quoteDepositPaid: true,
        finalPaymentAmount: true,
        finalPaymentPaid: true,
        finalShippingIncludedInPrice: true,
        finalShippingOptionId: true,
        currency: true,
        form: {
          select: {
            id: true,
            title: true,
            seller: {
              select: {
                id: true,
                connectedAccountId: true,
                userId: true,
                shopName: true,
                isFoundingSeller: true,
                hasCommissionDiscount: true,
                commissionDiscountExpiresAt: true,
                stripeTransfersCapability: true,
              },
            },
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (submission.userId !== authSession.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const sellerRow = submission.form.seller;
    if (!sellerRow?.connectedAccountId) {
      return NextResponse.json(
        { error: "Seller's Stripe account not connected" },
        { status: 400 },
      );
    }

    if (sellerRow.stripeTransfersCapability !== "active") {
      const account = await stripeSecret.instance.accounts.retrieve(
        sellerRow.connectedAccountId,
      );
      if (
        !account.capabilities?.transfers ||
        account.capabilities.transfers !== "active"
      ) {
        return NextResponse.json(
          {
            error: "Seller's Stripe account is not fully set up.",
            details:
              "The seller needs to complete their Stripe account setup to receive payments.",
          },
          { status: 400 },
        );
      }
      void db.seller
        .update({
          where: { id: sellerRow.id },
          data: {
            stripeTransfersCapability: account.capabilities?.transfers ?? null,
            stripeCapabilitiesSyncedAt: new Date(),
          },
        })
        .catch((e) =>
          console.warn(
            "[custom-order-create-payment-intent] capability cache update failed",
            e,
          ),
        );
    }

    let paymentAmountMinor: number;
    if (isDeposit) {
      if (submission.quoteDepositPaid) {
        return NextResponse.json(
          { error: "Deposit already paid" },
          { status: 400 },
        );
      }
      if (!submission.quoteDepositMinor) {
        return NextResponse.json(
          { error: "Deposit amount not set by seller" },
          { status: 400 },
        );
      }
      paymentAmountMinor = submission.quoteDepositMinor;
    } else {
      if (!submission.quoteDepositPaid) {
        return NextResponse.json(
          { error: "Deposit must be paid first" },
          { status: 400 },
        );
      }
      if (submission.finalPaymentPaid) {
        return NextResponse.json(
          { error: "Final payment already paid" },
          { status: 400 },
        );
      }
      if (!submission.finalPaymentAmount) {
        return NextResponse.json(
          { error: "Final payment amount not set by seller" },
          { status: 400 },
        );
      }
      paymentAmountMinor = submission.finalPaymentAmount;
    }

    /** Shipping (submission currency, minor units) added at checkout when seller chose a profile. */
    let finalShippingMinorSubmission = 0;
    if (
      isFinal &&
      !submission.finalShippingIncludedInPrice &&
      submission.finalShippingOptionId
    ) {
      const ship = await computeCustomOrderFinalShippingMinor({
        shippingOptionId: submission.finalShippingOptionId,
        sellerUserId: sellerRow.userId,
        destinationCountry: shippingAddress!.country,
        submissionCurrency: submission.currency,
      });
      if ("error" in ship) {
        return NextResponse.json({ error: ship.error }, { status: 400 });
      }
      finalShippingMinorSubmission = ship.shippingMinor;
      paymentAmountMinor =
        (paymentAmountMinor as number) + finalShippingMinorSubmission;
    }

    let finalAmount = paymentAmountMinor;
    let checkoutCurrency = submission.currency.toLowerCase();

    if (
      preferredCurrency &&
      preferredCurrency.toLowerCase() !== submission.currency.toLowerCase()
    ) {
      try {
        finalAmount = await convertCurrencyAmount(
          paymentAmountMinor,
          submission.currency,
          preferredCurrency,
          true,
        );
        checkoutCurrency = preferredCurrency.toLowerCase();
      } catch (e) {
        console.error("[custom-order-create-payment-intent] currency convert:", e);
      }
    }

    const commissionRate = calculateCommissionRate(
      sellerRow.isFoundingSeller || false,
      sellerRow.hasCommissionDiscount || false,
      sellerRow.commissionDiscountExpiresAt || null,
    );
    const platformFeeInCents = Math.round(
      finalAmount * (commissionRate / 100),
    );

    const { email: contactEmail, name: contactName } =
      getDecryptedCustomerContact(submission);
    const buyerEmail = authSession.user.email || contactEmail;
    if (!buyerEmail?.includes("@")) {
      return NextResponse.json(
        { error: "Valid buyer email required for payment" },
        { status: 400 },
      );
    }

    let customerId: string | undefined;
    const fallbackName =
      contactName || authSession.user.name?.trim() || undefined;
    try {
      const existing = await stripeSecret.instance.customers.list({
        email: buyerEmail,
        limit: 1,
      });
      const ship = isFinal ? shippingAddress! : undefined;
      const billAddr =
        isFinal && sameAsShipping
          ? shippingAddress!
          : isFinal && billingAddress
            ? billingAddress
            : undefined;

      const stripeAddress = billAddr
        ? {
            line1: billAddr.street,
            city: billAddr.city,
            state: billAddr.state,
            postal_code: billAddr.postal,
            country: billAddr.country,
          }
        : undefined;

      if (existing.data.length > 0) {
        const c = await stripeSecret.instance.customers.update(
          existing.data[0].id,
          {
            name: ship?.name || fallbackName,
            ...(ship && {
              shipping: {
                name: ship.name,
                address: {
                  line1: ship.street,
                  city: ship.city,
                  state: ship.state,
                  postal_code: ship.postal,
                  country: ship.country,
                },
              },
            }),
            ...(stripeAddress && { address: stripeAddress }),
          },
        );
        customerId = c.id;
      } else {
        const c = await stripeSecret.instance.customers.create({
          email: buyerEmail,
          name: ship?.name || fallbackName,
          ...(ship && {
            shipping: {
              name: ship.name,
              address: {
                line1: ship.street,
                city: ship.city,
                state: ship.state,
                postal_code: ship.postal,
                country: ship.country,
              },
            },
          }),
          ...(stripeAddress && { address: stripeAddress }),
        });
        customerId = c.id;
      }
    } catch (e) {
      console.warn("[custom-order-create-payment-intent] customer upsert:", e);
    }

    let checkoutDraftId = "";
    if (isFinal && shippingAddress) {
      const draftToken = randomUUID();
      const enc = encryptOrderData(
        JSON.stringify({ shipping: shippingAddress }),
      );
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      await db.checkoutDraft.create({
        data: {
          draftToken,
          encryptedPayload: enc.encrypted,
          payloadIV: enc.iv,
          payloadSalt: enc.salt,
          expiresAt,
        },
      });
      checkoutDraftId = draftToken;
    }

    const piParams: Stripe.PaymentIntentCreateParams = {
      amount: finalAmount,
      currency: checkoutCurrency,
      customer: customerId,
      receipt_email: buyerEmail,
      automatic_payment_methods: { enabled: true },
      metadata: {
        customOrderSubmissionId: submissionId,
        customOrderPaymentType: paymentType,
        paymentType,
        platformFee: platformFeeInCents.toString(),
        userId: authSession.user.id,
        sellerId: sellerRow.id,
        formId: submission.form.id,
        checkoutDraftId: checkoutDraftId || "",
        buyerEmail,
        buyerName:
          (isFinal ? shippingAddress?.name : contactName) ||
          authSession.user.name ||
          "",
        ...(isFinal && finalShippingMinorSubmission > 0
          ? {
              finalShippingMinor: String(finalShippingMinorSubmission),
            }
          : {}),
      },
    };

    const paymentIntent = await stripeSecret.instance.paymentIntents.create(
      piParams,
      stripeIdempotencyKey ? { idempotencyKey: stripeIdempotencyKey } : undefined,
    );

    if (isDeposit) {
      await db.customOrderSubmission.update({
        where: { id: submissionId },
        data: { quoteDepositSessionId: paymentIntent.id },
      });
    } else {
      await db.customOrderSubmission.update({
        where: { id: submissionId },
        data: { finalPaymentSessionId: paymentIntent.id },
      });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      customerId: customerId ?? null,
      amount: finalAmount,
      currency: checkoutCurrency,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: unknown) {
    console.error("[CUSTOM_ORDER_PAYMENT_INTENT_ERROR]", error);
    const userMessage = logError({
      code: "CUSTOM_ORDER_PAYMENT_INTENT_FAILED",
      userId: authSession?.user?.id,
      route: "/api/stripe/custom-order-create-payment-intent",
      method: "POST",
      error,
      metadata: {
        submissionId: (body as { submissionId?: string }).submissionId,
        paymentType: (body as { paymentType?: string }).paymentType,
      },
    });
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

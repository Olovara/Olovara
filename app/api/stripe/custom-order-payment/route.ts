import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripeCheckout, stripeSecret } from "@/lib/stripe";
import { calculateCommissionRate } from "@/lib/feeConfig";
import { convertCurrencyAmount } from "@/lib/currency-convert";
import type { Stripe } from "stripe";
import { logError } from "@/lib/error-logger";
import { getDecryptedCustomerContact } from "@/lib/custom-order-submission-contact";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    body = await req.json();
    const {
      submissionId,
      paymentType, // "MATERIALS_DEPOSIT" or "FINAL_PAYMENT"
      preferredCurrency,
    } = body;

    if (!submissionId || !paymentType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Fetch the submission and seller information
    const submission = await db.customOrderSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        userId: true,
        customerEmail: true,
        customerName: true,
        encryptedCustomerEmail: true,
        customerEmailIV: true,
        customerEmailSalt: true,
        encryptedCustomerName: true,
        customerNameIV: true,
        customerNameSalt: true,
        status: true,
        materialsDepositAmount: true,
        finalPaymentAmount: true,
        totalAmount: true,
        currency: true,
        materialsDepositPaid: true,
        finalPaymentPaid: true,
        shippingCost: true,
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
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      );
    }

    // Verify the user owns this submission
    if (submission.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!submission.form.seller?.connectedAccountId) {
      return NextResponse.json(
        { error: "Seller's Stripe account not connected" },
        { status: 400 },
      );
    }

    const sellerRow = submission.form.seller;
    if (sellerRow.stripeTransfersCapability !== "active") {
      const account = await stripeSecret.instance.accounts.retrieve(
        sellerRow.connectedAccountId!,
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
            "[custom-order-payment] capability cache update failed",
            e,
          ),
        );
    }

    // Determine payment amount based on type
    let paymentAmount: number;
    let paymentDescription: string;
    let successUrl: string;
    let cancelUrl: string;

    if (paymentType === "MATERIALS_DEPOSIT") {
      if (submission.materialsDepositPaid) {
        return NextResponse.json(
          { error: "Materials deposit already paid" },
          { status: 400 },
        );
      }

      if (!submission.materialsDepositAmount) {
        return NextResponse.json(
          { error: "Materials deposit amount not set by seller" },
          { status: 400 },
        );
      }

      paymentAmount = submission.materialsDepositAmount;
      paymentDescription = `Materials deposit for custom order: ${submission.form.title}`;
      successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/custom-order/${submissionId}/materials-paid`;
      cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/custom-order/${submissionId}`;
    } else if (paymentType === "FINAL_PAYMENT") {
      if (!submission.materialsDepositPaid) {
        return NextResponse.json(
          { error: "Materials deposit must be paid first" },
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

      paymentAmount = submission.finalPaymentAmount;
      paymentDescription = `Final payment for custom order: ${submission.form.title}`;
      successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/custom-order/${submissionId}/final-paid`;
      cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/custom-order/${submissionId}`;
    } else {
      return NextResponse.json(
        { error: "Invalid payment type" },
        { status: 400 },
      );
    }

    // Convert currency if needed
    let finalPaymentAmount = paymentAmount;
    let checkoutCurrency = submission.currency.toLowerCase();

    if (
      preferredCurrency &&
      preferredCurrency.toLowerCase() !== submission.currency.toLowerCase()
    ) {
      try {
        finalPaymentAmount = await convertCurrencyAmount(
          paymentAmount,
          submission.currency,
          preferredCurrency,
          true,
        );
        checkoutCurrency = preferredCurrency.toLowerCase();
      } catch (error) {
        console.error("Currency conversion failed:", error);
        // Continue with original currency
      }
    }

    // Calculate dynamic commission rate based on seller status and discount eligibility
    const commissionRate = calculateCommissionRate(
      submission.form.seller?.isFoundingSeller || false,
      submission.form.seller?.hasCommissionDiscount || false,
      submission.form.seller?.commissionDiscountExpiresAt || null,
    );

    // Calculate platform fee
    const platformFeeInCents = Math.round(
      finalPaymentAmount * (commissionRate / 100),
    );
    const sellerAmountInCents = finalPaymentAmount - platformFeeInCents;

    const { email: checkoutCustomerEmail } =
      getDecryptedCustomerContact(submission);
    if (!checkoutCustomerEmail?.includes("@")) {
      return NextResponse.json(
        { error: "Customer email is missing or invalid for checkout" },
        { status: 400 },
      );
    }

    // Create Stripe checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: checkoutCurrency,
            product_data: {
              name: paymentDescription,
              description: `Custom order from ${submission.form.seller.shopName}`,
            },
            unit_amount: finalPaymentAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: checkoutCustomerEmail,
      tax_id_collection: {
        enabled: true,
      },
      shipping_address_collection:
        paymentType === "FINAL_PAYMENT"
          ? {
              allowed_countries: [
                "US",
                "CA",
                "GB",
                "AU",
                "JP",
                "IN",
                "SG",
                "DE",
                "FR",
                "IT",
                "ES",
                "NL",
                "BE",
                "AT",
                "CH",
                "SE",
                "NO",
                "DK",
                "FI",
                "IE",
                "NZ",
              ],
            }
          : undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        submissionId,
        paymentType,
        userId: session.user.id,
        sellerId: submission.form.seller.id,
        formId: submission.form.id,
        amount: finalPaymentAmount.toString(),
        platformFee: platformFeeInCents.toString(),
        sellerAmount: sellerAmountInCents.toString(),
        currency: checkoutCurrency,
      },
      payment_intent_data: {
        transfer_data: {
          destination: submission.form.seller.connectedAccountId,
        },
      },
      currency: checkoutCurrency,
      locale: "auto",
      payment_method_options: {
        card: {
          request_three_d_secure: "automatic",
        },
      },
      billing_address_collection: "required",
    };

    const checkoutSession =
      await stripeCheckout.instance.checkout.sessions.create(sessionParams);

    // Update submission with session ID
    if (paymentType === "MATERIALS_DEPOSIT") {
      await db.customOrderSubmission.update({
        where: { id: submissionId },
        data: { materialsDepositSessionId: checkoutSession.id },
      });
    } else {
      await db.customOrderSubmission.update({
        where: { id: submissionId },
        data: { finalPaymentSessionId: checkoutSession.id },
      });
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    // Log to console (always happens)
    console.error("[CUSTOM_ORDER_PAYMENT_ERROR]", error);

    // Log to database - user could email about "couldn't create payment session"
    const userMessage = logError({
      code: "CUSTOM_ORDER_PAYMENT_CREATE_FAILED",
      userId: session?.user?.id,
      route: "/api/stripe/custom-order-payment",
      method: "POST",
      error,
      metadata: {
        submissionId: body?.submissionId,
        paymentType: body?.paymentType,
        preferredCurrency: body?.preferredCurrency,
        note: "Failed to create custom order payment session",
      },
    });

    return NextResponse.json(
      {
        error: userMessage,
      },
      { status: 500 },
    );
  }
}

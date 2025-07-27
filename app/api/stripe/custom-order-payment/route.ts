import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripeCheckout, stripeSecret } from "@/lib/stripe";
import { PLATFORM_FEE_PERCENT, calculateCommissionRate } from "@/lib/feeConfig";
import type { Stripe } from "stripe";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      submissionId, 
      paymentType, // "MATERIALS_DEPOSIT" or "FINAL_PAYMENT"
      preferredCurrency 
    } = body;

    if (!submissionId || !paymentType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch the submission and seller information
    const submission = await db.customOrderSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        userId: true,
        customerEmail: true,
        customerName: true,
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
              },
            },
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Verify the user owns this submission
    if (submission.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!submission.form.seller?.connectedAccountId) {
      return NextResponse.json({ error: "Seller's Stripe account not connected" }, { status: 400 });
    }

    // Verify seller's Stripe account has required capabilities
    const account = await stripeSecret.instance.accounts.retrieve(submission.form.seller.connectedAccountId);
    if (!account.capabilities?.transfers || account.capabilities.transfers !== 'active') {
      return NextResponse.json({ 
        error: "Seller's Stripe account is not fully set up.",
        details: "The seller needs to complete their Stripe account setup to receive payments."
      }, { status: 400 });
    }

    // Determine payment amount based on type
    let paymentAmount: number;
    let paymentDescription: string;
    let successUrl: string;
    let cancelUrl: string;

    if (paymentType === "MATERIALS_DEPOSIT") {
      if (submission.materialsDepositPaid) {
        return NextResponse.json({ error: "Materials deposit already paid" }, { status: 400 });
      }
      
      if (!submission.materialsDepositAmount) {
        return NextResponse.json({ error: "Materials deposit amount not set by seller" }, { status: 400 });
      }
      
      paymentAmount = submission.materialsDepositAmount;
      paymentDescription = `Materials deposit for custom order: ${submission.form.title}`;
      successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/custom-order/${submissionId}/materials-paid`;
      cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/custom-order/${submissionId}`;
    } else if (paymentType === "FINAL_PAYMENT") {
      if (!submission.materialsDepositPaid) {
        return NextResponse.json({ error: "Materials deposit must be paid first" }, { status: 400 });
      }
      
      if (submission.finalPaymentPaid) {
        return NextResponse.json({ error: "Final payment already paid" }, { status: 400 });
      }
      
      if (!submission.finalPaymentAmount) {
        return NextResponse.json({ error: "Final payment amount not set by seller" }, { status: 400 });
      }
      
      paymentAmount = submission.finalPaymentAmount;
      paymentDescription = `Final payment for custom order: ${submission.form.title}`;
      successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/custom-order/${submissionId}/final-paid`;
      cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/custom-order/${submissionId}`;
    } else {
      return NextResponse.json({ error: "Invalid payment type" }, { status: 400 });
    }

    // Convert currency if needed
    let finalPaymentAmount = paymentAmount;
    let checkoutCurrency = submission.currency.toLowerCase();

    if (preferredCurrency && preferredCurrency.toLowerCase() !== submission.currency.toLowerCase()) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/currency/convert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: paymentAmount,
            fromCurrency: submission.currency,
            toCurrency: preferredCurrency,
            isCents: true
          })
        });

        if (!response.ok) {
          throw new Error('Currency conversion failed');
        }

        const { convertedAmount } = await response.json();
        finalPaymentAmount = convertedAmount;
        checkoutCurrency = preferredCurrency.toLowerCase();
      } catch (error) {
        console.error('Currency conversion failed:', error);
        // Continue with original currency
      }
    }

    // Calculate dynamic commission rate based on seller status and discount eligibility
    const commissionRate = calculateCommissionRate(
      submission.form.seller?.isFoundingSeller || false,
      submission.form.seller?.hasCommissionDiscount || false,
      submission.form.seller?.commissionDiscountExpiresAt || null
    );
    
    // Calculate platform fee
    const platformFeeInCents = Math.round(finalPaymentAmount * (commissionRate / 100));
    const sellerAmountInCents = finalPaymentAmount - platformFeeInCents;

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
      customer_email: submission.customerEmail,
      tax_id_collection: {
        enabled: true,
      },
      shipping_address_collection: paymentType === "FINAL_PAYMENT" ? {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'JP', 'IN', 'SG', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'NZ'],
      } : undefined,
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
      locale: 'auto',
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
      billing_address_collection: 'required',
    };

    const checkoutSession = await stripeCheckout.instance.checkout.sessions.create(sessionParams);

    // Update submission with session ID
    if (paymentType === "MATERIALS_DEPOSIT") {
      await db.customOrderSubmission.update({
        where: { id: submissionId },
        data: { materialsDepositSessionId: checkoutSession.id }
      });
    } else {
      await db.customOrderSubmission.update({
        where: { id: submissionId },
        data: { finalPaymentSessionId: checkoutSession.id }
      });
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("[CUSTOM_ORDER_PAYMENT_ERROR]", error);
    return NextResponse.json({ 
      error: error.message || "Internal Error",
      details: error.stack
    }, { status: 500 });
  }
} 
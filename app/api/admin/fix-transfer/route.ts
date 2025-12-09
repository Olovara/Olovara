import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripeSecret } from "@/lib/stripe";
import type { Stripe } from "stripe";

/**
 * Admin endpoint to manually create a transfer for an order that failed
 * This is used to fix orders where the transfer failed due to insufficient funds
 * 
 * POST /api/admin/fix-transfer
 * Body: { orderId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is admin
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const admin = await db.admin.findUnique({
      where: { userId: session.user.id },
      select: { id: true, role: true }
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Fetch the order with related data
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        product: {
          include: {
            seller: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Check if transfer already exists
    if (order.stripeTransferId) {
      return NextResponse.json(
        { error: "Transfer already exists for this order", transferId: order.stripeTransferId },
        { status: 400 }
      );
    }

    if (!order.product?.seller?.connectedAccountId) {
      return NextResponse.json(
        { error: "Seller connected account not found" },
        { status: 400 }
      );
    }

    // Get payment intent ID from stripeSessionId
    const paymentIntentId = order.stripeSessionId;
    if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
      return NextResponse.json(
        { error: "Invalid payment intent ID in order" },
        { status: 400 }
      );
    }

    // Retrieve payment intent and charge
    const paymentIntent = await stripeSecret.instance.paymentIntents.retrieve(paymentIntentId);
    
    // Get the charge
    const charges = await stripeSecret.instance.charges.list({
      payment_intent: paymentIntentId,
      limit: 1,
    });

    if (charges.data.length === 0) {
      return NextResponse.json(
        { error: "No charge found for this payment intent" },
        { status: 404 }
      );
    }

    const charge = charges.data[0];
    
    // Get Stripe fee from balance transaction
    let stripeFee = order.stripeFee || 0;
    if (charge.balance_transaction) {
      try {
        const balanceTransaction = await stripeSecret.instance.balanceTransactions.retrieve(
          charge.balance_transaction as string
        );
        stripeFee = balanceTransaction.fee;
      } catch (error) {
        console.warn("Could not retrieve balance transaction, using stored fee");
      }
    }

    // Calculate amount to transfer
    const totalAmountInCents = order.totalAmount;
    const platformFeeInCents = order.platformFee;
    const amountToSeller = Math.max(1, totalAmountInCents - platformFeeInCents - stripeFee);

    console.log(`💰 Manual transfer calculation for order ${orderId}:`);
    console.log(`- Total amount: ${totalAmountInCents} cents`);
    console.log(`- Platform fee: ${platformFeeInCents} cents`);
    console.log(`- Stripe fee: ${stripeFee} cents`);
    console.log(`- Amount to seller: ${amountToSeller} cents`);
    console.log(`- Charge ID: ${charge.id}`);

    // Create transfer with source_transaction
    const transferParams: Stripe.TransferCreateParams = {
      amount: amountToSeller,
      currency: (order.currency || 'usd').toLowerCase(),
      destination: order.product.seller.connectedAccountId,
      transfer_group: paymentIntentId,
      source_transaction: charge.id, // CRITICAL: Transfer directly from charge
      metadata: {
        orderId: order.id,
        paymentIntentId: paymentIntentId,
        platformFee: platformFeeInCents.toString(),
        stripeFee: stripeFee.toString(),
        totalAmount: totalAmountInCents.toString(),
        manuallyCreated: 'true',
        createdBy: session.user.id,
      },
    };

    const transfer = await stripeSecret.instance.transfers.create(transferParams);

    // Update order with transfer ID
    await db.order.update({
      where: { id: order.id },
      data: { 
        stripeTransferId: transfer.id,
        updatedAt: new Date(),
      }
    });

    console.log(`✅ Successfully created transfer ${transfer.id} for order ${orderId}`);

    return NextResponse.json({
      success: true,
      transferId: transfer.id,
      amountTransferred: amountToSeller,
      message: `Transfer created successfully. ${(amountToSeller / 100).toFixed(2)} ${order.currency || 'USD'} transferred to seller.`
    });

  } catch (error: any) {
    console.error("❌ Error creating manual transfer:", error);
    return NextResponse.json(
      { 
        error: "Failed to create transfer",
        message: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}


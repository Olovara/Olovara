import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";
import { checkDigitalRefundEligibility } from "@/lib/refund-policy";
import { stripeSecret } from "@/lib/stripe";

export async function POST(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    // Validate that the orderId is a valid ObjectID
    if (!ObjectId.isValid(params.orderId)) {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 }
      );
    }

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = params.orderId;
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    // Check if the order belongs to the authenticated user
    const order = await db.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      select: {
        id: true,
        stripeSessionId: true,
        totalAmount: true,
        isDigital: true,
        digitalDownloadAttempted: true,
        digitalDownloadedAt: true,
        status: true,
        paymentStatus: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check refund eligibility
    const refundDecision = await checkDigitalRefundEligibility(orderId);

    if (!refundDecision.canRefund) {
      return NextResponse.json({
        error: "Refund not allowed",
        reason: refundDecision.reason,
        downloadAttempted: refundDecision.downloadAttempted,
        downloadedAt: refundDecision.downloadedAt,
      }, { status: 403 });
    }

    // If digital product was downloaded, deny refund
    if (order.isDigital && order.digitalDownloadAttempted) {
      return NextResponse.json({
        error: "Refund denied - digital product has been downloaded",
        reason: "Digital products cannot be refunded after download to prevent fraud",
        downloadAttempted: true,
        downloadedAt: order.digitalDownloadedAt,
      }, { status: 403 });
    }

    // Process the refund through Stripe
    try {
      // Get the payment intent from the session
      const stripeSession = await stripeSecret.instance.checkout.sessions.retrieve(
        order.stripeSessionId,
        { expand: ['payment_intent'] }
      );

      if (!stripeSession.payment_intent) {
        return NextResponse.json({ error: "Payment intent not found" }, { status: 400 });
      }

      const paymentIntentId = typeof stripeSession.payment_intent === 'string' 
        ? stripeSession.payment_intent 
        : stripeSession.payment_intent.id;

      // Create refund
      const refund = await stripeSecret.instance.refunds.create({
        payment_intent: paymentIntentId,
        amount: Math.round(order.totalAmount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          orderId: order.id,
          refundedBy: session?.user?.id || 'unknown',
          refundReason: 'Customer requested refund',
          digitalDownloadAttempted: order.digitalDownloadAttempted?.toString() || 'false',
        },
      });

      // Update order status
      await db.order.update({
        where: { id: orderId },
        data: {
          status: "REFUNDED",
          paymentStatus: "REFUNDED",
        },
      });

      return NextResponse.json({
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100, // Convert back to dollars
        reason: refundDecision.reason,
      });

    } catch (stripeError) {
      console.error("Stripe refund error:", stripeError);
      return NextResponse.json({ 
        error: "Failed to process refund through Stripe",
        details: stripeError instanceof Error ? stripeError.message : "Unknown error"
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Refund API error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 
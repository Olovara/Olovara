import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Get the order
    const order = await db.order.findUnique({
      where: { id: params.orderId },
      include: { seller: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    // Verify the user is the seller of this order
    if (order.sellerId !== userId) {
      return NextResponse.json(
        { error: "You are not authorized to refund this order." },
        { status: 403 }
      );
    }

    // Check if the order is already refunded or cancelled
    if (order.status === OrderStatus.REFUNDED) {
      return NextResponse.json(
        { error: "This order is already refunded." },
        { status: 400 }
      );
    }

    if (order.status === OrderStatus.CANCELLED) {
      return NextResponse.json(
        { error: "Cannot refund a cancelled order." },
        { status: 400 }
      );
    }

    // Check if the order has a Stripe session ID
    if (!order.stripeSessionId) {
      return NextResponse.json(
        { error: "No payment information found for this order." },
        { status: 400 }
      );
    }

    try {
      // Get the Stripe session to find the payment intent
      const stripeSession = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
      
      if (!stripeSession.payment_intent) {
        return NextResponse.json(
          { error: "No payment information found for this order." },
          { status: 400 }
        );
      }

      // Process the refund through Stripe
      const refund = await stripe.refunds.create({
        payment_intent: stripeSession.payment_intent as string,
        amount: Math.round(order.totalAmount * 100), // Convert to cents
        reason: "requested_by_customer",
      });

      if (refund.status !== "succeeded") {
        return NextResponse.json(
          { error: "Failed to process refund. Please try again." },
          { status: 500 }
        );
      }

      // Update the order status to REFUNDED
      await db.order.update({
        where: { id: params.orderId },
        data: {
          status: OrderStatus.REFUNDED,
          paymentStatus: PaymentStatus.REFUNDED
        },
      });

      return NextResponse.json({ success: "Order refunded successfully." });
    } catch (stripeError) {
      console.error("Stripe error:", stripeError);
      return NextResponse.json(
        { error: "Failed to process refund with Stripe. Please check your Stripe configuration." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in refund order API:", error);
    return NextResponse.json(
      { error: "Failed to refund order" },
      { status: 500 }
    );
  }
} 
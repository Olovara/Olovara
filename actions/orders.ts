import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { auth } from "@/auth";
import Stripe from "stripe";

export async function getSellerOrders(userId: string) {
  if (!userId) {
    throw new Error("You must be logged in!");
  }

  return await db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }, // Optional: Sort by created date
  });
}

export async function cancelOrder(orderId: string) {
  try {
    // Get the current user
    const authSession = await auth();
    const userId = authSession?.user?.id;
    
    if (!userId) {
      return { error: "You must be logged in to cancel an order." };
    }

    // Get the order
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { seller: true },
    });

    if (!order) {
      return { error: "Order not found." };
    }

    // Verify the user is the seller of this order
    if (order.sellerId !== userId) {
      return { error: "You are not authorized to cancel this order." };
    }

    // Check if the order is already cancelled or completed
    if (order.status === "CANCELLED") {
      return { error: "This order is already cancelled." };
    }

    if (order.status === "COMPLETED") {
      return { error: "Cannot cancel a completed order." };
    }

    // Update the order status to CANCELLED
    await db.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });

    return { success: "Order cancelled successfully." };
  } catch (error) {
    console.error("Error cancelling order:", error);
    return { error: "Failed to cancel order. Please try again." };
  }
}

export async function refundOrder(orderId: string) {
  try {
    // Get the current user
    const authSession = await auth();
    const userId = authSession?.user?.id;
    
    if (!userId) {
      return { error: "You must be logged in to refund an order." };
    }

    // Get the order
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { seller: true },
    });

    if (!order) {
      return { error: "Order not found." };
    }

    // Verify the user is the seller of this order
    if (order.sellerId !== userId) {
      return { error: "You are not authorized to refund this order." };
    }

    // Check if the order has been paid
    if (order.paymentStatus !== "PAID") {
      return { error: "Cannot refund an unpaid order." };
    }

    // Check if the order has a Stripe session ID
    if (!order.stripeSessionId) {
      return { error: "No payment information found for this order." };
    }

    try {
      // Get the Stripe session to find the payment intent
      const stripeSession = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
      
      if (!stripeSession.payment_intent) {
        return { error: "No payment information found for this order." };
      }

      // Process the refund through Stripe
      const refund = await stripe.refunds.create({
        payment_intent: stripeSession.payment_intent as string,
        amount: Math.round(order.totalAmount * 100), // Convert to cents
        reason: "requested_by_customer",
      });

      if (refund.status !== "succeeded") {
        return { error: "Failed to process refund. Please try again." };
      }

      // Update the order status to REFUNDED
      await db.order.update({
        where: { id: orderId },
        data: { 
          status: "REFUNDED",
          paymentStatus: "REFUNDED"
        },
      });

      return { success: "Order refunded successfully." };
    } catch (stripeError) {
      console.error("Stripe error:", stripeError);
      return { error: "Failed to process refund with Stripe. Please check your Stripe configuration." };
    }
  } catch (error) {
    console.error("Error refunding order:", error);
    return { error: "Failed to refund order. Please try again." };
  }
}

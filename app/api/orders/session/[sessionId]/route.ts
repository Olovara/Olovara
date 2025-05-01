import { NextResponse } from "next/server";
import { stripeCheckout } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await stripeCheckout.checkout.sessions.retrieve(params.sessionId, {
      expand: ['payment_intent'],
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Find the order in our database
    const order = await db.order.findFirst({
      where: {
        stripeSessionId: params.sessionId,
      },
      include: {
        product: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: order.id,
      totalAmount: order.totalAmount,
      status: order.status,
      product: {
        name: order.product.name,
        price: order.product.price,
      },
      shippingAddress: order.shippingAddress,
    });
  } catch (error) {
    console.error("[ORDER_DETAILS_ERROR]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
} 
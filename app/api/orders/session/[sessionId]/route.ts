import { NextResponse } from "next/server";
import { stripeCheckout } from "@/lib/stripe";
import { db } from "@/lib/db";
import { decryptData } from "@/lib/encryption";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  // Extract sessionId from params immediately to avoid scope issues
  const sessionIdParam = params.sessionId;
  let sessionId: string | undefined = sessionIdParam;

  try {
    const session = await stripeCheckout.instance.checkout.sessions.retrieve(
      sessionId,
      {
        expand: ["payment_intent"],
      }
    );

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Find the order in our database
    const order = await db.order.findFirst({
      where: {
        stripeSessionId: sessionId,
      },
      select: {
        id: true,
        totalAmount: true,
        status: true,
        product: {
          select: {
            name: true,
            price: true,
          },
        },
        encryptedBuyerEmail: true,
        buyerEmailIV: true,
        buyerEmailSalt: true,
        encryptedBuyerName: true,
        buyerNameIV: true,
        buyerNameSalt: true,
        encryptedShippingAddress: true,
        shippingAddressIV: true,
        shippingAddressSalt: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Decrypt sensitive data
    const buyerEmail = decryptData(
      order.encryptedBuyerEmail,
      order.buyerEmailIV,
      order.buyerEmailSalt
    );
    const buyerName = decryptData(
      order.encryptedBuyerName,
      order.buyerNameIV,
      order.buyerNameSalt
    );
    const shippingAddress = order.encryptedShippingAddress
      ? JSON.parse(
          decryptData(
            order.encryptedShippingAddress,
            order.shippingAddressIV,
            order.shippingAddressSalt
          )
        )
      : null;

    return NextResponse.json({
      id: order.id,
      totalAmount: order.totalAmount,
      status: order.status,
      product: {
        name: order.product.name,
        price: order.product.price,
      },
      shippingAddress,
      buyerEmail,
      buyerName,
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("[ORDER_DETAILS_ERROR]", error);

    // Log to database - user could email about "can't load order details"
    const userMessage = logError({
      code: "ORDER_SESSION_FETCH_FAILED",
      userId: undefined, // Public route (order lookup by session ID)
      route: "/api/orders/session/[sessionId]",
      method: "GET",
      error,
      metadata: {
        sessionId,
        note: "Failed to fetch order details from Stripe session",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { stripeCheckout } from "@/lib/stripe";
import { db } from "@/lib/db";
import { decryptData } from "@/lib/encryption";

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await stripeCheckout.instance.checkout.sessions.retrieve(params.sessionId, {
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
    const buyerEmail = decryptData(order.encryptedBuyerEmail, order.buyerEmailIV, order.buyerEmailSalt);
    const buyerName = decryptData(order.encryptedBuyerName, order.buyerNameIV, order.buyerNameSalt);
    const shippingAddress = order.encryptedShippingAddress 
      ? JSON.parse(decryptData(order.encryptedShippingAddress, order.shippingAddressIV, order.shippingAddressSalt))
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
    console.error("[ORDER_DETAILS_ERROR]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
} 
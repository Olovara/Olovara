import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { auth } from "@/auth";
import { Session } from "next-auth";
import { db } from "@/lib/db";
import { PLATFORM_FEE_PERCENT } from "@/lib/feeConfig";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, quantity = 1, guestEmail = null } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const sessionUser = (await auth()) as Session | null;
    const isGuestCheckout = !sessionUser;
    const buyerEmail = sessionUser?.user?.email || guestEmail;

    if (!buyerEmail) {
      return NextResponse.json(
        { error: "Email is required for checkout" },
        { status: 400 }
      );
    }

    const product = await db.product.findUnique({
      where: { id: productId },
      include: { seller: true },
    });

    if (!product || !product.seller) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!product.seller.connectedAccountId) {
      return NextResponse.json(
        { error: "Seller is not connected to Stripe" },
        { status: 400 }
      );
    }

    // Stripe expects prices in cents
    const totalAmountInCents = Math.round(product.price * 100) * quantity;

    // Calculate 10% platform fee in cents
    const platformFee = Math.round(
      totalAmountInCents * (PLATFORM_FEE_PERCENT / 100)
    );

    // Clean up HTML tags from description if present
    const cleanDescription =
      typeof product.description === "string"
        ? product.description
            .replace(/<\/?[^>]+(>|$)/g, "")
            .replace(/\s+/g, " ")
            .trim()
        : "No description available";

    const shippingAddress = "123 Anyroad, Anytown";

    // Create pending order in DB before payment
    const order = await db.order.create({
      data: {
        userId: sessionUser?.user?.id || null,
        buyerEmail,
        sellerId: product.seller.id,
        productId: product.id,
        productName: product.name,
        quantity,
        totalAmount: product.price * quantity, // store in dollars
        shippingCost: 0, // you can update this if needed
        discount: 0, // update if needed
        isDigital: product.isDigital,
        paymentStatus: "PENDING",
        status: "UNPAID",
        shippingAddress: shippingAddress,
      },
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.name,
              description: cleanDescription,
              images: product.images ? [product.images[0]] : [],
            },
            unit_amount: Math.round(product.price * 100), // unit price in cents
          },
          quantity,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/order-cancelled`,
      customer_email: buyerEmail,
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: product.seller.connectedAccountId,
        },
      },
      metadata: {
        productId,
        quantity,
        totalAmount: product.price * quantity, // still in dollars for display
        buyerId: isGuestCheckout ? "guest" : sessionUser?.user?.id || "unknown",
        sellerId: product.seller.id,
        isGuestCheckout: isGuestCheckout ? "true" : "false",
        orderId: order.id,
      },
    });

    await db.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({ sessionUrl: session.url });
  } catch (error: any) {
    console.error("🔥 Checkout Error:", error);
    return NextResponse.json(
      { error: "Checkout session creation failed" },
      { status: 500 }
    );
  }
}

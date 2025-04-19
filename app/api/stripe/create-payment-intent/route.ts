import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { PLATFORM_FEE_PERCENT } from "@/lib/feeConfig";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { productId, quantity } = body;

    if (!productId || !quantity) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Fetch the product and seller information
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        seller: {
          select: {
            connectedAccountId: true,
            userId: true,
          },
        },
      },
    });

    if (!product) {
      return new NextResponse("Product not found", { status: 404 });
    }

    if (!product.seller?.connectedAccountId) {
      return new NextResponse("Seller's Stripe account not connected", { status: 400 });
    }

    // Calculate the total amount
    const totalAmount = product.price * quantity;
    const platformFee = Math.round(totalAmount * PLATFORM_FEE_PERCENT);

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: "usd",
      payment_method_types: ["card"],
      metadata: {
        productId,
        quantity: quantity.toString(),
        userId: session.user.id,
        sellerId: product.seller.userId,
      },
      application_fee_amount: platformFee * 100, // Convert to cents
      transfer_data: {
        destination: product.seller.connectedAccountId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("[PAYMENT_INTENT_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 
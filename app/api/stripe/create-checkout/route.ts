import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { auth } from "@/auth";

// Define Type for Session to avoid TS errors
import { Session } from "next-auth";
import Quill from "quill";

export async function POST(req: Request) {
  try {
    // Parse the request body and log it to check incoming data
    const body = await req.json();
    console.log("📦 Request Body:", body);

    // Destructure productId, quantity, and guestEmail from request body
    const productId = body?.productId; // Get productId from body
    const quantity = body?.quantity || 1; // Default quantity to 1 if undefined
    const guestEmail = body?.guestEmail || null; // Optional guest email

    // Check if productId is provided, log error if missing
    if (!productId) {
      console.error("❌ Missing Product ID");
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Log extracted values to confirm correct parsing
    console.log("✅ Extracted Values:", { productId, quantity, guestEmail });

    // Check if user is authenticated or use guest email
    const sessionUser = (await auth()) as Session | null;
    console.log("🔐 Authenticated User:", sessionUser);

    const isGuestCheckout = !sessionUser;
    const buyerEmail = sessionUser?.user?.email || guestEmail;

    // Log the buyer's email to ensure it's present
    console.log("📧 Buyer Email:", buyerEmail);

    if (!buyerEmail) {
      console.error("❌ Missing Buyer Email");
      return NextResponse.json(
        { error: "Email is required for checkout" },
        { status: 400 }
      );
    }

    // Fetch product details from the database
    console.log("🔍 Fetching product with ID:", productId);
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { seller: true },
    });

    // Check if product or seller exists
    if (!product || !product.seller) {
      console.error("❌ Product or Seller not found");
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if the seller has connected a Stripe account
    if (!product.seller.connectedAccountId) {
      console.error("❌ Seller is not connected to Stripe");
      return NextResponse.json(
        { error: "Seller is not connected to Stripe" },
        { status: 400 }
      );
    }

    // Calculate total amount and platform fee
    const totalAmount = product.price * quantity;
    console.log("💰 Total Amount:", totalAmount);

    const platformFee = Math.round(totalAmount * 0.1); // 10% platform fee
    console.log("💸 Platform Fee:", platformFee);

    const cleanDescription =
      typeof product.description === "string"
        ? product.description
            .replace(/<\/?[^>]+(>|$)/g, "")
            .replace(/\s+/g, " ")
            .trim()
        : "No description available"; // Fallback if description is not a string

    // Create Stripe Checkout Session
    console.log("🚀 Creating Stripe Checkout Session...");
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
              images: product.images ? [product.images[0]] : [], // Use first image if available
            },
            unit_amount: Math.round(product.price * 100), // Convert to cents
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
        buyerId: isGuestCheckout ? "guest" : sessionUser?.user?.id || "unknown",
        sellerId: product.seller.id,
        quantity,
        totalAmount,
        isGuestCheckout: isGuestCheckout ? "true" : "false",
      },
    });

    // Log success and return checkout session URL
    console.log("✅ Checkout Session Created:", session.url);
    return NextResponse.json({ sessionUrl: session.url });
  } catch (error: any) {
    // Log any errors encountered
    console.error("🔥 Checkout Error:", error);
    return NextResponse.json(
      { error: "Checkout session creation failed" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripeCheckout } from "@/lib/stripe";
import { PLATFORM_FEE_PERCENT } from "@/lib/feeConfig";

// Helper function to convert Quill delta to plain text
function quillDeltaToPlainText(delta: any): string {
  if (!delta || !delta.ops) return "";
  return delta.ops
    .map((op: any) => op.insert)
    .join("")
    .replace(/\n/g, " ")
    .trim();
}

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
            id: true,
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
      return new NextResponse("Seller's Stripe account not connected", {
        status: 400,
      });
    }

    // Calculate amounts in cents
    const productPriceInCents = Math.round(product.price * 100);
    const shippingCostInCents = Math.round((product.shippingCost || 0) * 100);
    const handlingFeeInCents = Math.round((product.handlingFee || 0) * 100);
    const parsedQuantity = parseInt(quantity.toString());

    const totalProductPriceInCents = productPriceInCents * parsedQuantity;
    const totalShippingAndHandlingInCents = shippingCostInCents + handlingFeeInCents;
    
    // Calculate platform fee only on the product price (not including shipping/handling)
    const platformFeeInCents = Math.round(totalProductPriceInCents * (PLATFORM_FEE_PERCENT / 100));

    // Convert Quill content to plain text
    const plainTextDescription = quillDeltaToPlainText(product.description) || "No description available";

    // Create a checkout session
    const checkoutSession = await stripeCheckout.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.name,
              description: plainTextDescription,
            },
            unit_amount: productPriceInCents, // Product price in cents
          },
          quantity: parsedQuantity,
        },
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Shipping & Handling',
              description: 'Shipping and handling fees for your order',
            },
            unit_amount: totalShippingAndHandlingInCents, // Combined shipping and handling in cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/product/${productId}`,
      metadata: {
        productId,
        quantity: parsedQuantity.toString(),
        userId: session.user.id,
        sellerId: product.seller.id,
        productPrice: totalProductPriceInCents.toString(), // Store in cents
        shippingAndHandling: totalShippingAndHandlingInCents.toString(), // Store in cents
        platformFee: platformFeeInCents.toString(), // Store in cents
      },
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[CHECKOUT_SESSION_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripeCheckout, stripeSecret } from "@/lib/stripe";
import { PLATFORM_FEE_PERCENT } from "@/lib/feeConfig";
import type { Stripe } from "stripe";

interface ProductDescription {
  html: string;
  text: string;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { productId, quantity, preferredCurrency } = body;

    if (!productId || !quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch the product and seller information
    const product = await db.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        price: true,
        description: true,
        currency: true,
        shippingCost: true,
        handlingFee: true,
        seller: {
          select: {
            id: true,
            connectedAccountId: true,
            userId: true,
          },
        },
        taxCode: true,
        taxExempt: true,
        taxCategory: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!product.seller?.connectedAccountId) {
      return NextResponse.json({ error: "Seller's Stripe account not connected" }, { status: 400 });
    }

    // Verify seller's Stripe account has required capabilities
    const account = await stripeSecret.instance.accounts.retrieve(product.seller.connectedAccountId);
    if (!account.capabilities?.transfers || account.capabilities.transfers !== 'active') {
      return NextResponse.json({ 
        error: "Seller's Stripe account is not fully set up. Please complete the onboarding process.",
        details: "The seller needs to complete their Stripe account setup to receive payments."
      }, { status: 400 });
    }

    // Calculate amounts in cents
    const productPriceInCents = product.price; // Already in cents
    const shippingCostInCents = product.shippingCost || 0; // Get from product, default to 0
    const handlingFeeInCents = product.handlingFee || 0;
    const parsedQuantity = parseInt(quantity.toString());

    // Convert prices to preferred currency if different from product currency
    let finalProductPriceInCents = productPriceInCents;
    let finalShippingAndHandlingInCents = shippingCostInCents + handlingFeeInCents;
    let checkoutCurrency = product.currency.toLowerCase();

    if (preferredCurrency && preferredCurrency.toLowerCase() !== product.currency.toLowerCase()) {
      try {
        console.log('Converting currency:', {
          from: product.currency,
          to: preferredCurrency,
          amount: productPriceInCents
        });
        
        // Convert product price
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/currency/convert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: productPriceInCents,
            fromCurrency: product.currency,
            toCurrency: preferredCurrency,
            isCents: true
          })
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Currency conversion failed:', error);
          throw new Error(`Currency conversion failed: ${error.error || 'Unknown error'}`);
        }

        const { convertedAmount } = await response.json();
        console.log('Currency conversion result:', {
          original: productPriceInCents,
          converted: convertedAmount,
          currency: preferredCurrency
        });

        if (!convertedAmount || isNaN(convertedAmount)) {
          throw new Error('Invalid conversion result');
        }

        finalProductPriceInCents = convertedAmount;

        // Convert shipping and handling
        const shippingResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/currency/convert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: shippingCostInCents + handlingFeeInCents,
            fromCurrency: product.currency,
            toCurrency: preferredCurrency,
            isCents: true
          })
        });

        if (!shippingResponse.ok) {
          const error = await shippingResponse.json();
          console.error('Shipping cost conversion failed:', error);
          throw new Error(`Shipping cost conversion failed: ${error.error || 'Unknown error'}`);
        }

        const { convertedAmount: convertedShipping } = await shippingResponse.json();
        
        if (!convertedShipping || isNaN(convertedShipping)) {
          throw new Error('Invalid shipping cost conversion result');
        }

        finalShippingAndHandlingInCents = convertedShipping;
        checkoutCurrency = preferredCurrency.toLowerCase();
      } catch (error) {
        console.error('Error converting currency:', error);
        // Fallback to original currency if conversion fails
        console.log('Falling back to original currency:', product.currency);
      }
    }

    const totalProductPriceInCents = finalProductPriceInCents * parsedQuantity;
    
    // Calculate platform fee only on the product price (not including shipping/handling)
    const platformFeeInCents = Math.round(totalProductPriceInCents * (PLATFORM_FEE_PERCENT / 100));

    // Handle description in new JSON format
    let productDescription = "No description available";
    if (product.description) {
      if (typeof product.description === 'string') {
        try {
          const parsed = JSON.parse(product.description) as unknown as ProductDescription;
          productDescription = parsed.text || "No description available";
        } catch {
          productDescription = product.description.replace(/<[^>]*>?/gm, '');
        }
      } else if (typeof product.description === 'object') {
        const desc = product.description as unknown as ProductDescription;
        productDescription = desc.text || "No description available";
      }
    }

    // Create a checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: checkoutCurrency,
            product_data: {
              name: product.name,
              description: productDescription,
              tax_code: product.taxCode || undefined,
              metadata: {
                tax_category: product.taxCategory || 'PHYSICAL_GOODS',
                tax_exempt: product.taxExempt ? 'true' : 'false'
              }
            },
            unit_amount: finalProductPriceInCents,
            tax_behavior: product.taxExempt ? 'exclusive' : 'inclusive',
          },
          quantity: parsedQuantity,
        },
        {
          price_data: {
            currency: checkoutCurrency,
            product_data: {
              name: 'Shipping & Handling',
              description: 'Shipping and handling fees for your order',
              tax_code: 'txcd_92010001', // Standard shipping tax code
            },
            unit_amount: finalShippingAndHandlingInCents,
            tax_behavior: 'inclusive',
          },
          quantity: 1,
        },
      ],
      automatic_tax: {
        enabled: true,
        liability: {
          type: 'self',
        },
      },
      tax_id_collection: {
        enabled: true,
      },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'JP', 'IN', 'SG', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'NZ'],
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/product/${productId}`,
      metadata: {
        productId,
        quantity: parsedQuantity.toString(),
        userId: session?.user?.id || 'guest',
        sellerId: product.seller.id,
        productPrice: totalProductPriceInCents.toString(),
        shippingAndHandling: finalShippingAndHandlingInCents.toString(),
        platformFee: platformFeeInCents.toString(),
        sellerCurrency: checkoutCurrency,
        originalPrice: finalProductPriceInCents.toString(),
        taxCategory: product.taxCategory,
        taxExempt: product.taxExempt.toString(),
      },
      // Add payment intent data for connected account
      payment_intent_data: {
        transfer_data: {
          destination: product.seller.connectedAccountId,
        },
      },
      // Add currency display settings
      currency: checkoutCurrency,
      locale: 'auto', // Let Stripe detect the user's locale
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
      billing_address_collection: 'required',
    };

    const checkoutSession = await stripeCheckout.instance.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("[CHECKOUT_SESSION_ERROR]", error);
    return NextResponse.json({ 
      error: error.message || "Internal Error",
      details: error.stack
    }, { status: 500 });
  }
} 

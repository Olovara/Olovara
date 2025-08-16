import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripeCheckout, stripeSecret } from "@/lib/stripe";
import { PLATFORM_FEE_PERCENT, calculateCommissionRate } from "@/lib/feeConfig";
import { calculateShippingCost } from "@/lib/shipping-calculator";
import { decryptOrderData } from "@/lib/encryption";
import { validateDiscountCode, calculateDiscount, calculateProductSaleDiscount } from "@/lib/discount-calculator";
import { verifyRecaptcha } from "@/lib/recaptcha";
import type { Stripe } from "stripe";

interface ProductDescription {
  html: string;
  text: string;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const { productId, quantity, preferredCurrency, discountCode, shippingAddress, billingAddress, recaptchaToken } = body;

    if (!productId || !quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify reCAPTCHA token
    const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'checkout', 0.5);
    if (!recaptchaResult.success) {
      console.error("reCAPTCHA verification failed:", recaptchaResult.error);
      return NextResponse.json({ 
        error: "Security verification failed. Please try again.",
        details: "reCAPTCHA verification failed",
        recaptchaError: recaptchaResult.error
      }, { status: 403 });
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
        isDigital: true,
        onSale: true,
        discount: true,
        saleStartDate: true,
        saleEndDate: true,
        saleStartTime: true,
        saleEndTime: true,
        seller: {
          select: {
            id: true,
            connectedAccountId: true,
            userId: true,
            excludedCountries: true,
            isFoundingSeller: true,
            hasCommissionDiscount: true,
            commissionDiscountExpiresAt: true,
            addresses: {
              where: { isDefault: true },
              select: { encryptedCountry: true, countryIV: true, countrySalt: true }
            },
            shippingOptions: {
              where: { isDefault: true },
              select: {
                id: true,
                countryOfOrigin: true,
                rates: {
                  select: {
                    zone: true,
                    isInternational: true,
                    price: true,
                    currency: true,
                    estimatedDays: true,
                    additionalItem: true,
                    serviceLevel: true,
                    isFreeShipping: true
                  }
                }
              }
            }
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

    // Calculate shipping cost dynamically if seller has shipping profiles
    let finalShippingCost = product.shippingCost || 0;
    let sellerOriginCountry = "";
    
    // Get seller's country from their default address or shipping profile
    if (product.seller?.addresses && product.seller.addresses.length > 0) {
      // Decrypt the seller's country from their default address
      const sellerAddress = product.seller.addresses[0];
      sellerOriginCountry = decryptOrderData(
        sellerAddress.encryptedCountry, 
        sellerAddress.countryIV, 
        sellerAddress.countrySalt
      );
    } else if (product.seller?.shippingOptions && product.seller.shippingOptions.length > 0) {
      // Fallback to shipping option country of origin
      const defaultOption = product.seller.shippingOptions[0];
      sellerOriginCountry = defaultOption.countryOfOrigin;
    }
    
        // If still no country found, we can't calculate dynamic shipping
    if (!sellerOriginCountry) {
      console.warn(`No seller country found for product ${productId}, using static shipping cost`);
    } else if (product.seller?.shippingOptions && product.seller.shippingOptions.length > 0) {
      // Get user's country from shipping address or fallback
      const userCountry = shippingAddress?.country || req.headers.get('x-user-country') || 'US';
      
      // Calculate shipping cost based on origin and destination
      const defaultOption = product.seller.shippingOptions[0];
      const shippingCalculation = calculateShippingCost(
        defaultOption.rates,
        sellerOriginCountry,
        userCountry,
        parseInt(quantity.toString())
      );
      
      if (shippingCalculation) {
        finalShippingCost = shippingCalculation.price;
        console.log(`Dynamic shipping calculated: ${finalShippingCost} cents for ${userCountry} from ${sellerOriginCountry}`);
      }
    }

    // Calculate product sale discount
    const saleDiscount = calculateProductSaleDiscount(product);
    const productPriceAfterSale = product.price - saleDiscount;

    // Calculate total order value in dollars (not cents) for authentication check
    const productPriceInDollars = productPriceAfterSale / 100;
    const shippingCostInDollars = finalShippingCost / 100;
    const handlingFeeInDollars = (product.handlingFee || 0) / 100;
    const totalOrderValue = (productPriceInDollars + shippingCostInDollars + handlingFeeInDollars) * parseInt(quantity.toString());

    // Check if authentication is required
    const requiresAuth = totalOrderValue >= 100 || product.isDigital;

    if (requiresAuth && !session?.user) {
      return NextResponse.json({ 
        error: "Authentication required", 
        details: totalOrderValue >= 100 
          ? "Orders over $100 require a signed-in account for fraud prevention." 
          : "Digital items require a signed-in account for fraud prevention.",
        requiresAuth: true,
        orderValue: totalOrderValue,
        isDigital: product.isDigital
      }, { status: 401 });
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
    const productPriceInCents = productPriceAfterSale; // Price after sale discount
    const shippingCostInCents = finalShippingCost;
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
        console.log('Falling back to original currency:', product.currency);
      }
    }

    const totalProductPriceInCents = finalProductPriceInCents * parsedQuantity;
    const totalOrderAmountInCents = totalProductPriceInCents + finalShippingAndHandlingInCents;

    // Validate discount code if provided
    let discountAmount = 0;
    let discountCodeId = null;
    let discountCodeUsed = null;

    if (discountCode) {
      const validationResult = await validateDiscountCode(
        discountCode,
        product.seller.id,
        productId,
        totalOrderAmountInCents,
        session?.user?.id
      );

      if (!validationResult.isValid) {
        return NextResponse.json({ 
          error: validationResult.error,
          details: "Discount code validation failed"
        }, { status: 400 });
      }

      // Check if discount can be stacked with product sale
      if (product.onSale && validationResult.discountCode && !validationResult.discountCode.stackableWithProductSales) {
        return NextResponse.json({ 
          error: "This discount code cannot be used with products on sale",
          details: "The discount code does not allow stacking with product sales"
        }, { status: 400 });
      }

      if (validationResult.discountCode) {
        discountAmount = validationResult.discountCode.discountAmount;
        discountCodeId = validationResult.discountCode.id;
        discountCodeUsed = validationResult.discountCode.code;
      }
    }

    // Calculate final amount after discount
    const finalOrderAmountInCents = Math.max(0, totalOrderAmountInCents - discountAmount);
    
    // Calculate dynamic commission rate based on seller status and discount eligibility
    const commissionRate = calculateCommissionRate(
      product.seller?.isFoundingSeller || false,
      product.seller?.hasCommissionDiscount || false,
      product.seller?.commissionDiscountExpiresAt || null
    );
    
    // Calculate platform fee only on the product price (not including shipping/handling or discounts)
    const platformFeeInCents = Math.round(totalProductPriceInCents * (commissionRate / 100));

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

    // Create line items for Stripe checkout
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    // Add product line item
    lineItems.push({
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
    });

    // Add shipping & handling line item
    if (finalShippingAndHandlingInCents > 0) {
      lineItems.push({
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
      });
    }

    // Add discount line item if applicable
    if (discountAmount > 0) {
      lineItems.push({
        price_data: {
          currency: checkoutCurrency,
          product_data: {
            name: `Discount: ${discountCodeUsed}`,
            description: 'Applied discount',
          },
          unit_amount: -discountAmount, // Negative amount for discount
          tax_behavior: 'inclusive',
        },
        quantity: 1,
      });
    }

    // Create a checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      automatic_tax: {
        enabled: true,
        liability: {
          type: 'self',
        },
      },
      tax_id_collection: {
        enabled: true,
      },
      // Pre-fill customer details if provided
      ...(shippingAddress && billingAddress ? {
        customer_details: {
          name: shippingAddress.name,
          email: session?.user?.email || undefined,
          address: {
            line1: shippingAddress.street,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postal_code: shippingAddress.postal,
            country: shippingAddress.country,
          },
        },
        // Don't collect shipping address since we already have it
        shipping_address_collection: undefined,
        // Set billing address collection to auto if billing address is same as shipping
        billing_address_collection: billingAddress && shippingAddress && 
          JSON.stringify(billingAddress) === JSON.stringify(shippingAddress) ? 'auto' : 'required',
      } : {
        // Only collect shipping address if not provided from checkout page
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'GB', 'AU', 'JP', 'IN', 'SG', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'NZ'],
        },
        billing_address_collection: 'required',
      }),
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/${productId}`,
      metadata: {
        productId,
        quantity: parsedQuantity.toString(),
        userId: session?.user?.id || 'guest',
        sellerId: product.seller.userId,
        productPrice: totalProductPriceInCents.toString(),
        shippingAndHandling: finalShippingAndHandlingInCents.toString(),
        platformFee: platformFeeInCents.toString(),
        sellerCurrency: checkoutCurrency,
        originalPrice: finalProductPriceInCents.toString(),
        taxCategory: product.taxCategory,
        taxExempt: product.taxExempt.toString(),
        isDigital: product.isDigital.toString(),
        requiresAuth: requiresAuth.toString(),
        orderValue: totalOrderValue.toString(),
        sellerOriginCountry: sellerOriginCountry,
        userCountry: shippingAddress?.country || req.headers.get('x-user-country') || 'US',
        dynamicShipping: (product.seller?.shippingOptions && product.seller.shippingOptions.length > 0).toString(),
        // Discount information
        discountCodeId: discountCodeId || '',
        discountCodeUsed: discountCodeUsed || '',
        discountAmount: discountAmount.toString(),
        saleDiscount: saleDiscount.toString(),
        finalOrderAmount: finalOrderAmountInCents.toString(),
        // Shipping address information
        shippingAddressProvided: shippingAddress ? 'true' : 'false',
        // Billing address information
        billingAddressProvided: billingAddress ? 'true' : 'false',
        billingAddressSameAsShipping: billingAddress && shippingAddress && 
          JSON.stringify(billingAddress) === JSON.stringify(shippingAddress) ? 'true' : 'false',
      },
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

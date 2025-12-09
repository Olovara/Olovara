import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripeSecret } from "@/lib/stripe";
import { PLATFORM_FEE_PERCENT, calculateCommissionRate } from "@/lib/feeConfig";
import { calculateShippingCost } from "@/lib/shipping-calculator";
import { decryptOrderData } from "@/lib/encryption";
import { getCountryByCode } from "@/data/countries";
import { validateDiscountCode, calculateDiscount, calculateProductSaleDiscount } from "@/lib/discount-calculator";
import { verifyRecaptcha } from "@/lib/recaptcha";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const { productId, quantity, preferredCurrency, discountCode, shippingAddress, billingAddress, recaptchaToken, abandonedCartSessionId } = body;

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
        shippingOptionId: true,
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
              select: {
                id: true,
                isDefault: true,
                countryOfOrigin: true,
                defaultShipping: true,
                defaultShippingCurrency: true,
                rates: {
                  select: {
                    zone: true,
                    price: true,
                    additionalItem: true,
                    isFreeShipping: true,
                    type: true,
                    countryCode: true
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
    
    // Skip shipping calculation for digital products or if product has free shipping
    if (!product.isDigital && finalShippingCost > 0) {
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
        
        // Use the product's selected shipping option, or fall back to default
        let selectedOption = product.seller.shippingOptions.find(
          (option) => option.id === product.shippingOptionId
        );
        
        // If product doesn't have a selected shipping option, use default
        if (!selectedOption) {
          selectedOption = product.seller.shippingOptions.find(
            (option) => option.isDefault
          ) || product.seller.shippingOptions[0];
        }
        
        // Calculate shipping cost based on origin and destination
        const shippingCalculation = calculateShippingCost(
          selectedOption.rates.map(rate => {
            // For country type, determine zone from country code if zone is not set
            let zoneValue = rate.zone;
            if (!zoneValue && rate.countryCode) {
              const country = getCountryByCode(rate.countryCode);
              zoneValue = country?.zone || "NORTH_AMERICA";
            }
            return {
              zone: zoneValue || "NORTH_AMERICA", // Ensure zone is always set
              price: rate.price,
              currency: selectedOption.defaultShippingCurrency || "USD", // Use shipping option currency
              additionalItem: rate.additionalItem,
              isFreeShipping: rate.isFreeShipping,
              type: (rate.type || "zone") as "zone" | "country",
              countryCode: rate.countryCode || undefined
            };
          }),
          sellerOriginCountry,
          userCountry,
          parseInt(quantity.toString()),
          selectedOption.defaultShipping ?? null,
          selectedOption.defaultShippingCurrency || "USD"
        );
        
        if (shippingCalculation) {
          finalShippingCost = shippingCalculation.price;
          console.log(`Dynamic shipping calculated: ${finalShippingCost} cents for ${userCountry} from ${sellerOriginCountry} using shipping option ${selectedOption.id}`);
        } else {
          // Fallback to static shipping cost if calculation fails
          console.warn(`Shipping calculation failed for product ${productId}, using static shipping cost`);
        }
      }
    } else if (product.isDigital) {
      console.log(`Digital product - no shipping cost needed`);
    } else {
      console.log(`Product has free shipping - no shipping cost needed`);
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
          product.seller.userId,
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
    
    // Calculate platform fee on the total order amount (product + shipping + handling, before discounts)
    const totalOrderAmountBeforeDiscount = totalProductPriceInCents + finalShippingAndHandlingInCents;
    const platformFeeInCents = Math.round(totalOrderAmountBeforeDiscount * (commissionRate / 100));
    
    console.log(`💰 Platform fee calculation:`);
    console.log(`- Total order amount (before discount): ${totalOrderAmountBeforeDiscount} cents (${(totalOrderAmountBeforeDiscount / 100).toFixed(2)} ${checkoutCurrency.toUpperCase()})`);
    console.log(`- Commission rate: ${commissionRate}%`);
    console.log(`- Platform fee: ${platformFeeInCents} cents (${(platformFeeInCents / 100).toFixed(2)} ${checkoutCurrency.toUpperCase()})`);

    // Create or get customer with address information if provided
    let customerId: string | undefined;
    
    if (shippingAddress && billingAddress && session?.user?.email) {
      try {
        // Use the platform's Stripe instance for customer operations
        const stripe = stripeSecret.instance;
        
        // Check if customer already exists
        const existingCustomers = await stripe.customers.list({
          email: session.user.email,
          limit: 1,
        });

        if (existingCustomers.data.length > 0) {
          // Update existing customer with new address information
          const customer = await stripe.customers.update(existingCustomers.data[0].id, {
            name: shippingAddress.name,
            address: {
              line1: shippingAddress.street,
              city: shippingAddress.city,
              state: shippingAddress.state,
              postal_code: shippingAddress.postal,
              country: shippingAddress.country,
            },
            shipping: {
              name: shippingAddress.name,
              address: {
                line1: shippingAddress.street,
                city: shippingAddress.city,
                state: shippingAddress.state,
                postal_code: shippingAddress.postal,
                country: shippingAddress.country,
              },
            },
          });
          customerId = customer.id;
        } else {
          // Create new customer with address information
          const customer = await stripe.customers.create({
            email: session.user.email,
            name: shippingAddress.name,
            address: {
              line1: shippingAddress.street,
              city: shippingAddress.city,
              state: shippingAddress.state,
              postal_code: shippingAddress.postal,
              country: shippingAddress.country,
            },
            shipping: {
              name: shippingAddress.name,
              address: {
                line1: shippingAddress.street,
                city: shippingAddress.city,
                state: shippingAddress.state,
                postal_code: shippingAddress.postal,
                country: shippingAddress.country,
              },
            },
          });
          customerId = customer.id;
        }
        
        console.log('Customer created/updated successfully:', customerId);
      } catch (error) {
        console.error('Error creating/updating customer:', error);
        // Continue without customer pre-filling if there's an error
      }
    }

    // Create payment intent with application fee
    const paymentIntent = await stripeSecret.instance.paymentIntents.create({
      amount: finalOrderAmountInCents,
      currency: checkoutCurrency,
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      // Note: We handle fees and transfers manually in the webhook for better control
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
        abandonedCartSessionId: abandonedCartSessionId || '', // Store abandoned cart session ID
        requiresAuth: requiresAuth.toString(),
        orderValue: totalOrderValue.toString(),
        sellerOriginCountry: sellerOriginCountry,
        userCountry: shippingAddress?.country || req.headers.get('x-user-country') || 'US',
        dynamicShipping: (product.seller?.shippingOptions && product.seller.shippingOptions.length > 0).toString(),
        // Buyer information - store in metadata for webhook retrieval
        buyerEmail: session?.user?.email || billingAddress?.email || shippingAddress?.email || '',
        buyerName: shippingAddress?.name || billingAddress?.name || session?.user?.name || '',
        // Discount information
        discountCodeId: discountCodeId || '',
        discountCodeUsed: discountCodeUsed || '',
        discountAmount: discountAmount.toString(),
        saleDiscount: saleDiscount.toString(),
        finalOrderAmount: finalOrderAmountInCents.toString(),
        // Shipping address information
        shippingAddressProvided: shippingAddress ? 'true' : 'false',
        shippingAddress: shippingAddress ? JSON.stringify({
          name: shippingAddress.name,
          street: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal: shippingAddress.postal,
          country: shippingAddress.country,
        }) : '',
        // Billing address information
        billingAddressProvided: billingAddress ? 'true' : 'false',
        billingAddressSameAsShipping: billingAddress && shippingAddress && 
          JSON.stringify(billingAddress) === JSON.stringify(shippingAddress) ? 'true' : 'false',
      },
    });

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      customerId: customerId,
      amount: finalOrderAmountInCents,
      currency: checkoutCurrency,
    });
  } catch (error: any) {
    console.error("[PAYMENT_INTENT_ERROR]", error);
    return NextResponse.json({ 
      error: error.message || "Internal Error",
      details: error.stack
    }, { status: 500 });
  }
} 
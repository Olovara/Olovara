import { NextResponse } from "next/server";
import { stripeWebhook, stripeCheckout, stripeSecret } from "@/lib/stripe";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import type { Stripe } from "stripe";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { Resend } from "resend";
import ProductEmail from "@/components/emails/ProductEmail";
import SellerOrderEmail from "@/components/emails/SellerOrderEmail";
import { encryptOrderData, decryptOrderData } from "@/lib/encryption";

const resend = new Resend(process.env.RESEND_API_KEY);

// Remove edge runtime to avoid potential issues
// export const runtime = 'edge';
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  console.log("🔔 Webhook received");
  
  try {
    // Get the raw body as text
    const rawBody = await req.text();
    const sig = headers().get("stripe-signature") as string;

    if (!sig) {
      console.error("❌ No Stripe signature found in request");
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
    if (!webhookSecret) {
      console.error("❌ No webhook secret found in environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Log the signature and first few characters of the body for debugging
    console.log("🔍 Webhook signature:", sig);
    console.log("🔍 Webhook body preview:", rawBody.substring(0, 100));

    let event;
    try {
      event = stripeWebhook.instance.webhooks.constructEvent(
        rawBody,
        sig,
        webhookSecret
      );
      console.log(`✅ Webhook verified: ${event.type}`);
    } catch (err: any) {
      console.error("❌ Stripe Webhook Error:", err.message);
      console.error("❌ Webhook verification failed. Check if webhook secret matches Stripe dashboard.");
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          console.log(`✅ Processing checkout.session.completed: ${session.id}`);

          if (!session.payment_intent) {
            console.error("❌ Session completed without Payment Intent ID");
            throw new Error("Payment Intent ID missing");
          }

          if (!session.metadata) {
            console.error("❌ Session completed without metadata");
            throw new Error("Metadata missing from session");
          }

          // Fetch product details using metadata
          const product = await db.product.findUnique({
            where: { id: session.metadata.productId },
            include: { 
              seller: {
                include: {
                  user: true
                }
              }
            },
          });

          if (!product || !product.seller?.connectedAccountId) {
            console.error("❌ Product, Seller or Seller Connection not found for session:", session.id);
            throw new Error("Product/Seller details missing or incomplete");
          }

          // Create preliminary order
          const buyerEmail = session.customer_details?.email || "";
          const buyerName = session.customer_details?.name || "";
          const shippingAddress = session.shipping_details?.address
            ? JSON.stringify({
                city: session.shipping_details.address.city || "",
                country: session.shipping_details.address.country || "",
                line1: session.shipping_details.address.line1 || "",
                line2: session.shipping_details.address.line2 || "",
                postal_code: session.shipping_details.address.postal_code || "",
                state: session.shipping_details.address.state || "",
              })
            : null;

          const { encrypted: encryptedBuyerEmail, iv: buyerEmailIV, salt: buyerEmailSalt } = encryptOrderData(buyerEmail);
          const { encrypted: encryptedBuyerName, iv: buyerNameIV, salt: buyerNameSalt } = encryptOrderData(buyerName);
          const { encrypted: encryptedShippingAddress, iv: shippingAddressIV, salt: shippingAddressSalt } = shippingAddress 
            ? encryptOrderData(shippingAddress)
            : { encrypted: "", iv: "", salt: "" };

          const preliminaryOrderData = {
            userId: session.metadata.userId || "",
            encryptedBuyerEmail,
            buyerEmailIV,
            buyerEmailSalt,
            encryptedBuyerName,
            buyerNameIV,
            buyerNameSalt,
            sellerId: session.metadata.sellerId || "",
            shopName: product.seller?.shopName || "",
            productId: session.metadata.productId || "",
            productName: product.name,
            quantity: parseInt(session.metadata.quantity || "1"),
            totalAmount: parseInt(session.metadata.productPrice || "0") + parseInt(session.metadata.shippingAndHandling || "0"),
            productPrice: parseInt(session.metadata.productPrice || "0"),
            shippingCost: parseInt(session.metadata.shippingAndHandling || "0"),
            stripeFee: 0, // Placeholder
            isDigital: product.isDigital || false,
            status: product.isDigital ? OrderStatus.COMPLETED : OrderStatus.PENDING_TRANSFER,
            paymentStatus: PaymentStatus.PAID,
            stripeSessionId: session.id,
            stripeTransferId: null,
            encryptedShippingAddress,
            shippingAddressIV,
            shippingAddressSalt,
            discount: null,
            completedAt: product.isDigital ? new Date() : null,
            taxAmount: session.total_details?.amount_tax || 0,
            taxBreakdown: session.total_details?.breakdown ? JSON.stringify(session.total_details.breakdown) : null,
            taxExempt: session.metadata.taxExempt === 'true',
            taxCategory: session.metadata.taxCategory || null,
            taxCode: product.taxCode || null,
            taxJurisdiction: session.customer_details?.address?.country || null,
            taxRate: session.total_details?.amount_tax ? 
              (session.total_details.amount_tax / (session.amount_total || 1)) : null,
            taxType: session.total_details?.amount_tax ? 'VAT' : null, // Default to VAT, adjust based on jurisdiction
          };

          const order = await db.order.create({ data: preliminaryOrderData });
          console.log(`✅ Created preliminary order: ${order.id}`);

          // Retrieve Charge and Balance Transaction to get the exact fee
          const paymentIntent = await stripeSecret.instance.paymentIntents.retrieve(session.payment_intent as string);
          if (!paymentIntent.latest_charge) throw new Error("Charge ID missing from Payment Intent");

          let charge = await stripeSecret.instance.charges.retrieve(paymentIntent.latest_charge as string);

          // Check charge status - should be succeeded
          if (charge.status !== 'succeeded') {
            console.error(`❌ Charge ${charge.id} status is ${charge.status}, not 'succeeded'. Cannot process transfer yet.`);
            throw new Error(`Charge status is ${charge.status}, cannot get balance transaction.`);
          }

          let balanceTransactionId = charge.balance_transaction as string | null;

          // If balance_transaction ID is missing, try listing balance transactions by source (charge ID)
          if (!balanceTransactionId) {
            console.warn(`⚠️ Charge ${charge.id} status is 'succeeded', but balance_transaction ID initially missing. Trying list fallback.`);
            const btList = await stripeSecret.instance.balanceTransactions.list({
              source: charge.id,
              limit: 1 // We only expect one balance transaction per charge
            });

            if (btList.data.length > 0) {
              balanceTransactionId = btList.data[0].id;
              console.log(`✅ Fallback successful: Found balance transaction ${balanceTransactionId} via list.`);
            } else {
              // Optional: Add a small delay and retry the list once more, as a final check
              console.warn(`⚠️ Fallback list failed for charge ${charge.id}. Waiting 1 second and retrying list.`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
              const finalList = await stripeSecret.instance.balanceTransactions.list({ source: charge.id, limit: 1 });
              if (finalList.data.length > 0) {
                balanceTransactionId = finalList.data[0].id;
                console.log(`✅ Fallback successful on retry: Found balance transaction ${balanceTransactionId} via list.`);
              } else {
                console.error(`❌ Fallback failed again: No balance transaction found via list for charge ${charge.id}.`);
                throw new Error("Balance Transaction ID missing and list fallback failed");
              }
            }
          }

          // Ensure we have the ID before proceeding
          if (!balanceTransactionId) {
            // Should not happen if the logic above worked, but as a safeguard:
            throw new Error("Could not retrieve Balance Transaction ID");
          }

          // Retrieve the Balance Transaction using the obtained ID
          const balanceTransaction = await stripeSecret.instance.balanceTransactions.retrieve(balanceTransactionId);
          const stripeFee = balanceTransaction.fee; // Actual fee in cents
          console.log(`💰 Stripe fee from balance transaction: ${stripeFee} cents`);

          // Update order with Stripe fee (store in cents)
          await db.order.update({
            where: { id: order.id },
            data: { stripeFee: stripeFee }, // Store fee in cents
          });

          // Get amounts from metadata (already in cents)
          const totalAmountInCents = order.totalAmount;
          const platformFeeInCents = parseInt(session.metadata.platformFee || "0");
          const sellerCurrency = session.metadata.sellerCurrency || "usd"; // Get seller's currency from metadata
          const originalPrice = parseInt(session.metadata.originalPrice || "0"); // Get original price in seller's currency

          // Get the current exchange rate from the database
          const exchangeRate = await db.exchangeRate.findUnique({
            where: {
              baseCurrency_targetCurrency: {
                baseCurrency: product.currency.toUpperCase(), // Use product's currency as base
                targetCurrency: sellerCurrency.toUpperCase()
              }
            }
          });

          // Calculate amount to transfer (ensure at least 1 cent)
          const amountToSeller = Math.max(1,
            totalAmountInCents
            - stripeFee           // Stripe fee in cents
            - platformFeeInCents  // Your fee in cents
          );

          console.log(`💰 Transfer calculation (in ${product.currency.toUpperCase()}):`);
          console.log(`- Total amount: ${totalAmountInCents}`);
          console.log(`- Stripe fee: ${stripeFee}`);
          console.log(`- Platform fee: ${platformFeeInCents}`);
          console.log(`- Amount to seller: ${amountToSeller}`);
          console.log(`- Seller currency: ${sellerCurrency}`);
          console.log(`- Original price: ${originalPrice} ${sellerCurrency}`);
          console.log(`- Exchange rate: ${exchangeRate?.rate || 1}`);

          // Create transfer to seller with automatic currency conversion
          const transfer = await stripeSecret.instance.transfers.create({
            amount: amountToSeller,
            currency: product.currency.toLowerCase(), // Use product's currency
            destination: product.seller.connectedAccountId,
            transfer_group: session.payment_intent as string,
            source_transaction: charge.id,
            metadata: {
              orderId: order.id,
              sessionId: session.id,
              sellerCurrency: sellerCurrency, // Store the seller's preferred currency
              originalPrice: originalPrice.toString(), // Store the original price in seller's currency
              convertedAmount: amountToSeller.toString(), // Store the converted amount
              exchangeRate: exchangeRate?.rate?.toString() || "1", // Store the exchange rate used
              baseCurrency: product.currency.toUpperCase(), // Store the base currency
            }
          });
          console.log(`💰 Created transfer to seller: ${transfer.id} (${product.currency.toUpperCase()} to ${sellerCurrency})`);

          // Update order with transfer ID, currency info, exchange rate, and finalize status
          await db.order.update({
            where: { id: order.id },
            data: {
              stripeTransferId: transfer.id,
              currency: sellerCurrency, // Store the seller's preferred currency
              status: product.isDigital ? OrderStatus.COMPLETED : OrderStatus.PENDING,
              paymentStatus: PaymentStatus.PAID,
              completedAt: product.isDigital ? new Date() : null,
              // Add exchange rate information
              exchangeRate: exchangeRate?.rate || 1,
              baseCurrency: product.currency.toUpperCase(), // Use product's currency as base
              exchangeRateTimestamp: exchangeRate?.lastUpdated || new Date(),
            },
          });

          // Send confirmation email to buyer
          try {
            // Decrypt the buyer's email
            const buyerEmail = decryptOrderData(order.encryptedBuyerEmail, order.buyerEmailIV, order.buyerEmailSalt);
            
            // Decrypt and parse the shipping address if it exists
            const shippingAddress = order.encryptedShippingAddress 
              ? JSON.parse(decryptOrderData(order.encryptedShippingAddress, order.shippingAddressIV, order.shippingAddressSalt))
              : null;

            // Send buyer email
            const { data: buyerEmailData, error: buyerEmailError } = await resend.emails.send({
              from: "Yarnnu <noreply@yarnnu.com>",
              to: [buyerEmail],
              subject: product.isDigital ? "Your digital product is ready!" : "Your order has been confirmed!",
              react: ProductEmail({
                link: product.isDigital && product.productFile ? product.productFile : undefined,
                isDigital: product.isDigital,
                orderDetails: {
                  productName: product.name,
                  orderId: order.id,
                  shippingAddress: shippingAddress ? {
                    street: shippingAddress.line1 || "",
                    city: shippingAddress.city || "",
                    state: shippingAddress.state || "",
                    zipCode: shippingAddress.postal_code || "",
                    country: shippingAddress.country || "",
                  } : undefined,
                },
              }),
            });

            if (buyerEmailError) {
              console.error("❌ Error sending buyer confirmation email:", buyerEmailError);
            } else {
              console.log("✅ Buyer confirmation email sent successfully");
            }

            // Send seller notification email
            if (!product.seller.user.email) {
              console.error("❌ Seller email not found");
            } else {
              const { data: sellerEmailData, error: sellerEmailError } = await resend.emails.send({
                from: "Yarnnu <noreply@yarnnu.com>",
                to: [product.seller.user.email],
                subject: `New Sale Alert! Order #${order.id}`,
                react: SellerOrderEmail({
                  orderDetails: {
                    productName: product.name,
                    orderId: order.id,
                    quantity: order.quantity,
                    totalAmount: order.totalAmount,
                    buyerName: decryptOrderData(order.encryptedBuyerName, order.buyerNameIV, order.buyerNameSalt),
                    shippingAddress: shippingAddress ? {
                      street: shippingAddress.line1 || "",
                      city: shippingAddress.city || "",
                      state: shippingAddress.state || "",
                      zipCode: shippingAddress.postal_code || "",
                      country: shippingAddress.country || "",
                    } : undefined,
                  },
                }),
              });

              if (sellerEmailError) {
                console.error("❌ Error sending seller notification email:", sellerEmailError);
              } else {
                console.log("✅ Seller notification email sent successfully");
              }
            }
          } catch (emailError) {
            console.error("❌ Error sending emails:", emailError);
          }

          // Update product/seller stats
          try {
            // Update product stats
            await db.product.update({
              where: { id: session.metadata.productId },
              data: {
                numberSold: {
                  increment: parseInt(session.metadata.quantity || "1"),
                },
                // Only reduce stock if it's a physical product
                ...(product.isDigital === false && {
                  stock: {
                    decrement: parseInt(session.metadata.quantity || "1"),
                  },
                }),
              },
            });

            // Update seller stats
            await db.seller.update({
              where: { id: session.metadata.sellerId },
              data: {
                totalSales: {
                  increment: parseInt(session.metadata.quantity || "1"),
                },
              },
            });

            // Create reviews for the order
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 14); // 14 days from now

            // Get the seller's user ID
            const seller = await db.seller.findUnique({
              where: { id: session.metadata.sellerId },
              select: { userId: true },
            });

            if (!seller) {
              throw new Error("Seller not found");
            }

            // Create product review
            await db.review.create({
              data: {
                orderId: order.id,
                reviewerId: session.metadata.userId,
                reviewedId: seller.userId,
                sellerId: session.metadata.sellerId,
                productId: session.metadata.productId,
                type: "PRODUCT",
                status: "PENDING",
                expiresAt,
                rating: 0,
              },
            });

            // Create seller review
            await db.review.create({
              data: {
                orderId: order.id,
                reviewerId: session.metadata.userId,
                reviewedId: seller.userId,
                sellerId: session.metadata.sellerId,
                type: "SELLER",
                status: "PENDING",
                expiresAt,
                rating: 0,
              },
            });

            // Create buyer review
            await db.review.create({
              data: {
                orderId: order.id,
                reviewerId: seller.userId,
                reviewedId: session.metadata.userId,
                sellerId: session.metadata.sellerId,
                type: "BUYER",
                status: "PENDING",
                expiresAt,
                rating: 0,
              },
            });

            console.log(`✅ Updated product and seller stats for order ${order.id}`);
          } catch (statsError) {
            console.error("⚠️ Error updating product/seller stats:", statsError);
          }

          return NextResponse.json({ success: true, orderId: order.id });
        }
        case "charge.succeeded": {
          // Just log this event
          const charge = event.data.object as Stripe.Charge;
          console.log(`💰 Charge succeeded: ${charge.id}, PI: ${charge.payment_intent}`);
          return NextResponse.json({ received: true });
        }
        default: {
          console.log(`🤷 Unhandled event type: ${event.type}`);
          return NextResponse.json({ success: true, message: "Event type not handled" });
        }
      }
    } catch (error: any) {
      console.error("❌ Error processing webhook:", error);
      return NextResponse.json(
        { error: "Webhook processing failed", message: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("❌ Error in webhook handler:", error);
    return NextResponse.json(
      { error: "Webhook handler failed", message: error.message },
      { status: 500 }
    );
  }
}
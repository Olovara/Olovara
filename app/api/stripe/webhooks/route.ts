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

// Helper function to determine hold period in days
async function determineHoldPeriod(sellerId: string, isDigital: boolean): Promise<number> {
  try {
    // Get seller account details with user reputation data
    const seller = await db.seller.findUnique({
      where: { id: sellerId },
      select: {
        createdAt: true,
        user: {
          select: {
            accountReputation: true,
            numChargebacks: true,
            numRefunds: true,
            numDisputes: true,
          },
        },
      },
    });

    if (!seller) {
      console.warn(`⚠️ Seller not found for hold period calculation: ${sellerId}`);
      return 7; // Default to 7 days for unknown sellers
    }

    // Calculate account age in days
    const accountAgeInDays = Math.floor((Date.now() - seller.createdAt.getTime()) / (1000 * 60 * 60 * 24));

    // Digital items always have minimum 2-day hold
    if (isDigital) {
      return Math.max(2, calculateHoldPeriod(accountAgeInDays, seller));
    }

    return calculateHoldPeriod(accountAgeInDays, seller);
  } catch (error) {
    console.error("❌ Error determining hold period:", error);
    return 7; // Default to 7 days on error
  }
}

// Helper function to calculate hold period based on account age and reputation
function calculateHoldPeriod(accountAgeInDays: number, seller: any): number {
  // Check if seller is trusted (good reputation, low chargebacks/disputes)
  const isTrusted = seller.user?.accountReputation === "TRUSTED" && 
                   seller.user?.numChargebacks <= 1 && 
                   seller.user?.numDisputes <= 1;

  // New seller (less than 30 days): 10 days
  if (accountAgeInDays < 30) {
    return 10;
  }

  // Trusted seller (30+ days, good reputation): 1 day
  if (isTrusted) {
    return 1;
  }

  // Not trusted seller: 7 days
  return 7;
}

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
          
          // Use shipping address from checkout page if provided, otherwise from Stripe
          let shippingAddress = null;
          if (session.metadata.shippingAddressProvided === 'true') {
            // Shipping address was collected on our checkout page
            // We'll need to store it in the order metadata or create a separate field
            shippingAddress = "Address collected on checkout page"; // Placeholder
          } else {
            // Use Stripe's shipping details
            shippingAddress = session.shipping_details?.address
              ? JSON.stringify({
                  city: session.shipping_details.address.city || "",
                  country: session.shipping_details.address.country || "",
                  line1: session.shipping_details.address.line1 || "",
                  line2: session.shipping_details.address.line2 || "",
                  postal_code: session.shipping_details.address.postal_code || "",
                  state: session.shipping_details.address.state || "",
                })
              : null;
          }

          const { encrypted: encryptedBuyerEmail, iv: buyerEmailIV, salt: buyerEmailSalt } = encryptOrderData(buyerEmail);
          const { encrypted: encryptedBuyerName, iv: buyerNameIV, salt: buyerNameSalt } = encryptOrderData(buyerName);
          const { encrypted: encryptedShippingAddress, iv: shippingAddressIV, salt: shippingAddressSalt } = shippingAddress 
            ? encryptOrderData(shippingAddress)
            : { encrypted: "", iv: "", salt: "" };

          // Get discount information from metadata
          const discountCodeId = session.metadata.discountCodeId;
          const discountCodeUsed = session.metadata.discountCodeUsed;
          const discountAmount = parseInt(session.metadata.discountAmount || "0");
          const saleDiscount = parseInt(session.metadata.saleDiscount || "0");
          const finalOrderAmount = parseInt(session.metadata.finalOrderAmount || "0");

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
            totalAmount: finalOrderAmount || (parseInt(session.metadata.productPrice || "0") + parseInt(session.metadata.shippingAndHandling || "0")),
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
            discount: discountAmount > 0 ? JSON.stringify({
              discountCodeId,
              discountCodeUsed,
              discountAmount,
              saleDiscount,
            }) : null,
            discountCodeId: discountCodeId || null,
            discountCodeAmount: discountAmount,
            discountCodeUsed: discountCodeUsed || null,
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

          // Create discount usage record if discount code was used
          if (discountCodeId && discountAmount > 0) {
            try {
              await db.discountCodeUsage.create({
                data: {
                  discountCodeId,
                  orderId: order.id,
                  userId: session.metadata.userId || 'guest',
                  discountAmount,
                },
              });

              // Update discount code usage count
              await db.discountCode.update({
                where: { id: discountCodeId },
                data: {
                  currentUses: {
                    increment: 1,
                  },
                },
              });

              console.log(`✅ Created discount usage record for code: ${discountCodeUsed}`);
            } catch (error) {
              console.error("❌ Error creating discount usage record:", error);
            }
          }

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

          // Determine hold period based on seller account age and trust status
          const holdPeriodDays = await determineHoldPeriod(session.metadata.sellerId, product.isDigital);
          console.log(`⏰ Hold period determined: ${holdPeriodDays} days for ${product.isDigital ? 'digital' : 'physical'} product`);

          // Calculate transfer date (hold period from now)
          const transferDate = new Date();
          transferDate.setDate(transferDate.getDate() + holdPeriodDays);

          // Create transfer to seller with scheduled transfer
          const transferParams: Stripe.TransferCreateParams = {
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
              holdPeriodDays: holdPeriodDays.toString(),
              scheduledTransferDate: transferDate.toISOString(),
            },
          };

          // For holds, we'll use Stripe's transfer schedule feature
          // Note: This requires the connected account to have transfers enabled
          if (holdPeriodDays > 0) {
            // Use the delay_days parameter for scheduled transfers
            (transferParams as any).delay_days = holdPeriodDays;
          }

          const transfer = await stripeSecret.instance.transfers.create(transferParams);
          console.log(`💰 Created ${holdPeriodDays > 0 ? 'scheduled' : 'immediate'} transfer to seller: ${transfer.id} (${product.currency.toUpperCase()} to ${sellerCurrency})`);

          // Determine order status based on hold period and product type
          let orderStatus: OrderStatus;
          if (product.isDigital) {
            // Digital products are completed immediately (payment confirmed)
            orderStatus = OrderStatus.COMPLETED;
          } else if (holdPeriodDays > 0) {
            // Physical products with holds
            orderStatus = "HELD" as OrderStatus;
          } else {
            // Physical products without holds
            orderStatus = OrderStatus.PENDING;
          }

          // Update order with transfer ID, currency info, exchange rate, and finalize status
          await db.order.update({
            where: { id: order.id },
            data: {
              stripeTransferId: transfer.id,
              currency: sellerCurrency, // Store the seller's preferred currency
              status: orderStatus,
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
        case "account.updated": {
          const account = event.data.object as Stripe.Account;
          console.log(`🏦 Account updated: ${account.id}, charges_enabled: ${account.charges_enabled}, payouts_enabled: ${account.payouts_enabled}`);

          // Check if the account is fully onboarded (can accept charges and payouts)
          if (account.charges_enabled && account.payouts_enabled) {
            try {
              // Find the seller with this connected account ID
              const seller = await db.seller.findUnique({
                where: { connectedAccountId: account.id },
                select: { id: true, userId: true, stripeConnected: true }
              });

              if (seller && !seller.stripeConnected) {
                // Update the seller's stripeConnected status
                await db.seller.update({
                  where: { id: seller.id },
                  data: { stripeConnected: true }
                });

                console.log(`✅ Stripe account ${account.id} fully onboarded for seller ${seller.id}`);
              }
            } catch (error) {
              console.error("❌ Error updating seller stripeConnected status:", error);
            }
          }

          return NextResponse.json({ received: true });
        }
        case "charge.succeeded": {
          // Just log this event
          const charge = event.data.object as Stripe.Charge;
          console.log(`💰 Charge succeeded: ${charge.id}, PI: ${charge.payment_intent}`);
          return NextResponse.json({ received: true });
        }
        case "transfer.created": {
          const transfer = event.data.object as Stripe.Transfer;
          console.log(`💰 Transfer created: ${transfer.id}`);
          
          // Update order status if this is a held transfer
          if (transfer.metadata?.orderId) {
            try {
              const order = await db.order.findUnique({
                where: { id: transfer.metadata.orderId },
                select: { id: true, status: true, isDigital: true }
              });

              if (order && order.status === ("HELD" as any)) {
                console.log(`✅ Transfer created for held order: ${order.id}`);
              }
            } catch (error) {
              console.error("❌ Error updating order for transfer created:", error);
            }
          }
          
          return NextResponse.json({ received: true });
        }
        case "transfer.updated": {
          const transfer = event.data.object as Stripe.Transfer;
          console.log(`💰 Transfer updated: ${transfer.id}`);
          
          // Update order status from HELD to PENDING when transfer is completed
          if (transfer.metadata?.orderId && transfer.object === 'transfer') {
            try {
              const order = await db.order.findUnique({
                where: { id: transfer.metadata.orderId },
                select: { id: true, status: true, isDigital: true }
              });

              if (order && order.status === ("HELD" as any)) {
                await db.order.update({
                  where: { id: order.id },
                  data: { 
                    status: OrderStatus.PENDING,
                    completedAt: new Date()
                  }
                });
                console.log(`✅ Updated order ${order.id} from HELD to PENDING after transfer completed`);
              }
            } catch (error) {
              console.error("❌ Error updating order status after transfer updated:", error);
            }
          }
          
          return NextResponse.json({ received: true });
        }
        case "charge.refunded": {
          const charge = event.data.object as Stripe.Charge;
          console.log(`💰 Charge refunded: ${charge.id}`);
          
          // Find the order associated with this charge and revoke download access
          if (charge.payment_intent) {
            try {
              const order = await db.order.findFirst({
                where: { 
                  stripeSessionId: { contains: charge.payment_intent as string }
                },
                select: { id: true, isDigital: true }
              });

              if (order && order.isDigital) {
                // Update order status to REFUNDED
                await db.order.update({
                  where: { id: order.id },
                  data: {
                    status: "REFUNDED",
                    paymentStatus: "REFUNDED",
                  }
                });
                
                console.log(`✅ Order ${order.id} marked as refunded. Download access revoked.`);
                
                // Note: The download API will now deny access because status is REFUNDED
              }
            } catch (error) {
              console.error("❌ Error updating order after refund:", error);
            }
          }
          
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
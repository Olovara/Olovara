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
import { PLATFORM_FEE_PERCENT, calculateCommissionRate } from "@/lib/feeConfig";
import { updateOnboardingStep } from "@/lib/onboarding";
import { logError } from "@/lib/error-logger";

const resend = new Resend(process.env.RESEND_API_KEY);

// Remove edge runtime to avoid potential issues
// export const runtime = 'edge';
export const dynamic = "force-dynamic";

// Helper function to determine hold period in days
async function determineHoldPeriod(
  sellerId: string,
  isDigital: boolean
): Promise<number> {
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
      console.warn(
        `⚠️ Seller not found for hold period calculation: ${sellerId}`
      );
      return 7; // Default to 7 days for unknown sellers
    }

    // Calculate account age in days
    const accountAgeInDays = Math.floor(
      (Date.now() - seller.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

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
  const isTrusted =
    seller.user?.accountReputation === "TRUSTED" &&
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
  console.log("🔔 Webhook received at /api/stripe/webhooks");
  console.log("🔍 Request URL:", req.url);
  console.log("🔍 Request method:", req.method);

  try {
    // Get the raw body as text
    const rawBody = await req.text();
    const sig = headers().get("stripe-signature") as string;

    if (!sig) {
      console.error("❌ No Stripe signature found in request");
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    // Support multiple webhook secrets (for different webhook endpoints pointing to same route)
    // Primary secret (for main webhook)
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    // Secondary secret (for ConnectedAccounts webhook - if different)
    const connectWebhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;

    if (!webhookSecret && !connectWebhookSecret) {
      console.error("❌ No webhook secret found in environment variables");
      console.error(
        "❌ Need either STRIPE_WEBHOOK_SECRET or STRIPE_CONNECT_WEBHOOK_SECRET"
      );
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Log the signature and first few characters of the body for debugging
    console.log("🔍 Webhook signature:", sig);
    console.log("🔍 Webhook body preview:", rawBody.substring(0, 100));
    const secretStatus = {
      STRIPE_WEBHOOK_SECRET: webhookSecret ? "EXISTS" : "MISSING",
      STRIPE_CONNECT_WEBHOOK_SECRET: connectWebhookSecret
        ? "EXISTS"
        : "MISSING",
    };
    console.log("🔍 Webhook secret status:", secretStatus);

    let event: Stripe.Event | undefined;
    let usedSecret = "unknown";

    // Try primary secret first
    if (webhookSecret) {
      try {
        event = stripeWebhook.instance.webhooks.constructEvent(
          rawBody,
          sig,
          webhookSecret
        );
        usedSecret = "STRIPE_WEBHOOK_SECRET";
        console.log(`✅ Webhook verified with primary secret: ${event.type}`);
      } catch (err: any) {
        console.log(
          `⚠️ Primary secret verification failed, trying secondary secret...`
        );
        // If primary fails and we have a secondary secret, try that
        if (connectWebhookSecret) {
          try {
            event = stripeWebhook.instance.webhooks.constructEvent(
              rawBody,
              sig,
              connectWebhookSecret
            );
            usedSecret = "STRIPE_CONNECT_WEBHOOK_SECRET";
            console.log(
              `✅ Webhook verified with secondary secret: ${event.type}`
            );
          } catch (err2: any) {
            console.error("❌ Both webhook secrets failed verification");
            console.error("❌ Primary secret error:", err.message);
            console.error("❌ Secondary secret error:", err2.message);
            console.error(
              "❌ Webhook verification failed. Check if webhook secret matches Stripe dashboard."
            );
            console.error(
              "❌ Each webhook endpoint in Stripe has its own signing secret."
            );
            console.error(
              "❌ If you have multiple webhooks, you may need STRIPE_CONNECT_WEBHOOK_SECRET env var."
            );
            return NextResponse.json(
              { error: `Webhook Error: Signature verification failed` },
              { status: 400 }
            );
          }
        } else {
          // No secondary secret, primary failed
          console.error("❌ Stripe Webhook Error:", err.message);
          console.error(
            "❌ Webhook verification failed. Check if webhook secret matches Stripe dashboard."
          );
          console.error(
            "❌ If you have multiple webhooks pointing to this endpoint, you may need STRIPE_CONNECT_WEBHOOK_SECRET env var."
          );
          return NextResponse.json(
            { error: `Webhook Error: ${err.message}` },
            { status: 400 }
          );
        }
      }
    } else if (connectWebhookSecret) {
      // Only secondary secret available
      try {
        event = stripeWebhook.instance.webhooks.constructEvent(
          rawBody,
          sig,
          connectWebhookSecret
        );
        usedSecret = "STRIPE_CONNECT_WEBHOOK_SECRET";
        console.log(`✅ Webhook verified with secondary secret: ${event.type}`);
      } catch (err: any) {
        console.error("❌ Stripe Webhook Error:", err.message);
        console.error(
          "❌ Webhook verification failed. Check if webhook secret matches Stripe dashboard."
        );
        return NextResponse.json(
          { error: `Webhook Error: ${err.message}` },
          { status: 400 }
        );
      }
    }

    // Ensure event was successfully verified
    if (!event) {
      console.error("❌ Webhook event verification failed - no event created");
      return NextResponse.json(
        { error: "Webhook verification failed" },
        { status: 400 }
      );
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          console.log(`✅ Processing checkout.session.completed`);
          console.log(
            `📋 Session details: payment_intent=${session.payment_intent ? "EXISTS" : "MISSING"}, metadata=${session.metadata ? "EXISTS" : "MISSING"}, customer_details=${session.customer_details ? "EXISTS" : "MISSING"}`
          );

          if (!session.payment_intent) {
            console.error("❌ Session completed without Payment Intent ID");
            console.error("❌ Session status:", session.status);
            console.error("❌ Session mode:", session.mode);
            console.error("❌ Session payment_status:", session.payment_status);
            throw new Error("Payment Intent ID missing");
          }

          if (!session.metadata) {
            console.error("❌ Session completed without metadata");
            console.error("❌ Session ID exists:", !!session.id);
            console.error(
              "❌ Payment intent exists:",
              !!session.payment_intent
            );
            throw new Error("Metadata missing from session");
          }

          console.log(
            `📋 Metadata check: productId=${session.metadata.productId ? "EXISTS" : "MISSING"}, sellerId=${session.metadata.sellerId ? "EXISTS" : "MISSING"}, userId=${session.metadata.userId ? "EXISTS" : "MISSING"}`
          );

          // Fetch product details using metadata
          console.log(
            `🔍 Fetching product with ID: ${session.metadata.productId ? "EXISTS" : "MISSING"}`
          );
          let product;
          try {
            product = await db.product.findUnique({
              where: { id: session.metadata.productId },
              include: {
                seller: {
                  include: {
                    user: true,
                  },
                },
              },
            });
            console.log(
              `📦 Product fetch result: ${product ? "FOUND" : "NOT_FOUND"}`
            );
          } catch (dbError) {
            console.error(
              "❌ Database error fetching product:",
              dbError instanceof Error ? dbError.message : String(dbError)
            );
            console.error(
              "❌ Product ID from metadata:",
              session.metadata.productId ? "EXISTS" : "MISSING"
            );
            throw new Error("Failed to fetch product from database");
          }

          if (!product) {
            console.error("❌ Product not found in database");
            console.error(
              "❌ Product ID from metadata:",
              session.metadata.productId ? "EXISTS" : "MISSING"
            );
            throw new Error("Product not found");
          }

          if (!product.seller) {
            console.error("❌ Product found but seller is missing");
            console.error("❌ Product ID:", product.id ? "EXISTS" : "MISSING");
            throw new Error("Seller not found for product");
          }

          if (!product.seller.connectedAccountId) {
            console.error(
              "❌ Seller found but connected account ID is missing"
            );
            console.error(
              "❌ Seller ID:",
              product.seller.id ? "EXISTS" : "MISSING"
            );
            console.error(
              "❌ Seller user ID:",
              product.seller.userId ? "EXISTS" : "MISSING"
            );
            throw new Error("Seller connected account not found");
          }

          console.log(
            `✅ Product and seller validation passed: product=${product.id ? "EXISTS" : "MISSING"}, seller=${product.seller.id ? "EXISTS" : "MISSING"}, connectedAccount=${product.seller.connectedAccountId ? "EXISTS" : "MISSING"}`
          );

          // Create preliminary order
          // Get buyer email from Stripe's customer_details (should be available for all checkouts)
          const buyerEmail = session.customer_details?.email || "";
          const buyerName = session.customer_details?.name || "";

          // Log email retrieval for debugging
          if (!buyerEmail || buyerEmail.trim() === "") {
            console.warn(
              "⚠️ WARNING: Buyer email is empty or missing from checkout session. Email confirmation will not be sent."
            );
            console.warn(
              "⚠️ Customer details object:",
              session.customer_details ? "EXISTS" : "MISSING"
            );
            console.warn(
              "⚠️ Customer email in customer_details:",
              session.customer_details?.email ? "EXISTS" : "MISSING"
            );
            console.warn(
              "⚠️ Customer email in metadata:",
              session.metadata?.buyerEmail ? "EXISTS" : "MISSING"
            );
            console.warn(
              "⚠️ Customer name:",
              session.customer_details?.name ? "EXISTS" : "MISSING"
            );
          } else {
            const emailPrefix = buyerEmail.substring(0, 3);
            const emailDomain = buyerEmail.includes("@")
              ? buyerEmail.split("@")[1]?.substring(0, 3)
              : "***";
            console.log(
              `📧 Buyer email retrieved: ${emailPrefix}***@${emailDomain}*** (from customer_details)`
            );
          }

          console.log(`📋 Buyer name: ${buyerName ? "EXISTS" : "MISSING"}`);

          // Use shipping address from checkout page if provided, otherwise from Stripe
          let shippingAddress = null;
          if (session.metadata.shippingAddressProvided === "true") {
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
                  postal_code:
                    session.shipping_details.address.postal_code || "",
                  state: session.shipping_details.address.state || "",
                })
              : null;
          }

          // Encrypt buyer data
          let encryptedBuyerEmail, buyerEmailIV, buyerEmailSalt;
          let encryptedBuyerName, buyerNameIV, buyerNameSalt;
          let encryptedShippingAddress, shippingAddressIV, shippingAddressSalt;

          try {
            const emailEncryption = encryptOrderData(buyerEmail);
            encryptedBuyerEmail = emailEncryption.encrypted;
            buyerEmailIV = emailEncryption.iv;
            buyerEmailSalt = emailEncryption.salt;
            console.log(
              `🔐 Buyer email encrypted successfully: iv=${buyerEmailIV ? "EXISTS" : "MISSING"}, salt=${buyerEmailSalt ? "EXISTS" : "MISSING"}`
            );
          } catch (encryptError) {
            console.error(
              "❌ Error encrypting buyer email:",
              encryptError instanceof Error
                ? encryptError.message
                : String(encryptError)
            );
            throw new Error("Failed to encrypt buyer email");
          }

          try {
            const nameEncryption = encryptOrderData(buyerName);
            encryptedBuyerName = nameEncryption.encrypted;
            buyerNameIV = nameEncryption.iv;
            buyerNameSalt = nameEncryption.salt;
            console.log(
              `🔐 Buyer name encrypted successfully: iv=${buyerNameIV ? "EXISTS" : "MISSING"}, salt=${buyerNameSalt ? "EXISTS" : "MISSING"}`
            );
          } catch (encryptError) {
            console.error(
              "❌ Error encrypting buyer name:",
              encryptError instanceof Error
                ? encryptError.message
                : String(encryptError)
            );
            throw new Error("Failed to encrypt buyer name");
          }

          if (shippingAddress) {
            try {
              const addressEncryption = encryptOrderData(shippingAddress);
              encryptedShippingAddress = addressEncryption.encrypted;
              shippingAddressIV = addressEncryption.iv;
              shippingAddressSalt = addressEncryption.salt;
              console.log(
                `🔐 Shipping address encrypted successfully: iv=${shippingAddressIV ? "EXISTS" : "MISSING"}, salt=${shippingAddressSalt ? "EXISTS" : "MISSING"}`
              );
            } catch (encryptError) {
              console.error(
                "❌ Error encrypting shipping address:",
                encryptError instanceof Error
                  ? encryptError.message
                  : String(encryptError)
              );
              // Don't throw - shipping address is optional
              encryptedShippingAddress = "";
              shippingAddressIV = "";
              shippingAddressSalt = "";
            }
          } else {
            encryptedShippingAddress = "";
            shippingAddressIV = "";
            shippingAddressSalt = "";
            console.log(`📋 Shipping address: MISSING (not provided)`);
          }

          // Get discount information from metadata
          const discountCodeId = session.metadata.discountCodeId;
          const discountCodeUsed = session.metadata.discountCodeUsed;
          const discountAmount = parseInt(
            session.metadata.discountAmount || "0"
          );
          const saleDiscount = parseInt(session.metadata.saleDiscount || "0");
          const finalOrderAmount = parseInt(
            session.metadata.finalOrderAmount || "0"
          );

          // Retrieve order instructions from database (stored separately from Stripe)
          // Use payment intent ID if available, otherwise use session ID
          let orderInstructionsText: string | null = null;
          const paymentIntentId = session.payment_intent 
            ? (typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id)
            : session.id;
          
          try {
            const instructionsRecord = await db.orderInstructions.findUnique({
              where: { paymentIntentId },
            });
            if (instructionsRecord) {
              orderInstructionsText = instructionsRecord.instructions;
              console.log(`✅ Retrieved order instructions for session: ${session.id}`);
            }
          } catch (instructionsError) {
            console.error("❌ Error retrieving order instructions:", instructionsError);
            // Continue without instructions - not critical
          }

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
            totalAmount:
              finalOrderAmount ||
              parseInt(session.metadata.productPrice || "0") +
                parseInt(session.metadata.shippingAndHandling || "0"),
            productPrice: parseInt(session.metadata.productPrice || "0"),
            shippingCost: parseInt(session.metadata.shippingAndHandling || "0"),
            stripeFee: 0, // Placeholder
            platformFee: parseInt(session.metadata.platformFee || "0"), // Store platform fee from metadata
            isDigital: product.isDigital || false,
            status: product.isDigital
              ? OrderStatus.COMPLETED
              : OrderStatus.PENDING_TRANSFER,
            paymentStatus: PaymentStatus.PAID,
            stripeSessionId: session.id,
            stripeTransferId: null,
            encryptedShippingAddress,
            shippingAddressIV,
            shippingAddressSalt,
            discount:
              discountAmount > 0
                ? JSON.stringify({
                    discountCodeId,
                    discountCodeUsed,
                    discountAmount,
                    saleDiscount,
                  })
                : null,
            discountCodeId: discountCodeId || null,
            discountCodeAmount: discountAmount,
            discountCodeUsed: discountCodeUsed || null,
            completedAt: product.isDigital ? new Date() : null,
            taxAmount: session.total_details?.amount_tax || 0,
            taxBreakdown: session.total_details?.breakdown
              ? JSON.stringify(session.total_details.breakdown)
              : null,
            taxExempt: session.metadata.taxExempt === "true",
            taxCategory: session.metadata.taxCategory || null,
            taxCode: product.taxCode || null,
            taxJurisdiction: session.customer_details?.address?.country || null,
            taxRate: session.total_details?.amount_tax
              ? session.total_details.amount_tax / (session.amount_total || 1)
              : null,
            taxType: session.total_details?.amount_tax ? "VAT" : null, // Default to VAT, adjust based on jurisdiction
            batchNumber: product.batchNumber || null, // Include product batch number for traceability
            orderInstructions: orderInstructionsText, // Order instructions from buyer (retrieved from database)
          };

          // Create order in database
          let order;
          try {
            console.log(`💾 Creating order in database...`);
            console.log(
              `📋 Order data validation: totalAmount=${preliminaryOrderData.totalAmount}, productPrice=${preliminaryOrderData.productPrice}, shippingCost=${preliminaryOrderData.shippingCost}`
            );
            console.log(
              `📋 Order data validation: platformFee=${preliminaryOrderData.platformFee}, quantity=${preliminaryOrderData.quantity}, isDigital=${preliminaryOrderData.isDigital}`
            );
            order = await db.order.create({ data: preliminaryOrderData });
            console.log(`✅ Created preliminary order successfully`);
            console.log(
              `💰 Platform fee stored: ${preliminaryOrderData.platformFee} cents (${(preliminaryOrderData.platformFee / 100).toFixed(2)} ${session.currency?.toUpperCase() || "USD"})`
            );
            
            // Clean up temporary order instructions record after saving to order
            if (orderInstructionsText) {
              try {
                await db.orderInstructions.delete({
                  where: { paymentIntentId },
                });
                console.log(`✅ Cleaned up temporary order instructions for session: ${session.id}`);
              } catch (cleanupError) {
                console.error("❌ Error cleaning up order instructions:", cleanupError);
                // Non-critical error, continue
              }
            }
          } catch (orderError) {
            console.error("❌ CRITICAL: Failed to create order in database");
            console.error(
              "❌ Error type:",
              orderError instanceof Error
                ? orderError.constructor.name
                : typeof orderError
            );
            console.error(
              "❌ Error message:",
              orderError instanceof Error
                ? orderError.message
                : String(orderError)
            );
            console.error("❌ Order data validation:");
            console.error(
              "  - userId:",
              preliminaryOrderData.userId ? "EXISTS" : "MISSING"
            );
            console.error(
              "  - sellerId:",
              preliminaryOrderData.sellerId ? "EXISTS" : "MISSING"
            );
            console.error(
              "  - productId:",
              preliminaryOrderData.productId ? "EXISTS" : "MISSING"
            );
            console.error(
              "  - encryptedBuyerEmail:",
              preliminaryOrderData.encryptedBuyerEmail ? "EXISTS" : "MISSING"
            );
            console.error("  - totalAmount:", preliminaryOrderData.totalAmount);
            throw new Error("Failed to create order in database");
          }

          // Create discount usage record if discount code was used
          if (discountCodeId && discountAmount > 0) {
            try {
              console.log(
                `🎟️ Processing discount code: codeId=${discountCodeId ? "EXISTS" : "MISSING"}, amount=${discountAmount}, codeUsed=${discountCodeUsed ? "EXISTS" : "MISSING"}`
              );
              await db.discountCodeUsage.create({
                data: {
                  discountCodeId,
                  orderId: order.id,
                  userId:
                    session.metadata.userId &&
                    session.metadata.userId !== "guest"
                      ? session.metadata.userId
                      : null, // Use null for guest checkouts
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

              console.log(`✅ Created discount usage record successfully`);
            } catch (discountError) {
              console.error("❌ Error creating discount usage record");
              console.error(
                "❌ Error type:",
                discountError instanceof Error
                  ? discountError.constructor.name
                  : typeof discountError
              );
              console.error(
                "❌ Error message:",
                discountError instanceof Error
                  ? discountError.message
                  : String(discountError)
              );
              console.error(
                "❌ Discount code ID:",
                discountCodeId ? "EXISTS" : "MISSING"
              );
              console.error("❌ Order ID:", order.id ? "EXISTS" : "MISSING");
              // Don't throw - discount is not critical for order creation
            }
          } else {
            console.log(
              `📋 Discount code: NOT_USED (codeId=${discountCodeId ? "EXISTS" : "MISSING"}, amount=${discountAmount})`
            );
          }

          // Retrieve Charge and Balance Transaction to get the exact fee
          console.log(`🔍 Retrieving payment intent from Stripe...`);
          let paymentIntent;
          try {
            paymentIntent = await stripeSecret.instance.paymentIntents.retrieve(
              session.payment_intent as string
            );
            console.log(
              `✅ Payment intent retrieved: status=${paymentIntent.status}, amount=${paymentIntent.amount}, currency=${paymentIntent.currency}`
            );
          } catch (piError) {
            console.error("❌ Error retrieving payment intent from Stripe");
            console.error(
              "❌ Error type:",
              piError instanceof Error
                ? piError.constructor.name
                : typeof piError
            );
            console.error(
              "❌ Error message:",
              piError instanceof Error ? piError.message : String(piError)
            );
            console.error(
              "❌ Payment intent ID:",
              session.payment_intent ? "EXISTS" : "MISSING"
            );
            throw new Error("Failed to retrieve payment intent");
          }

          if (!paymentIntent.latest_charge) {
            console.error("❌ Charge ID missing from Payment Intent");
            console.error("❌ Payment intent status:", paymentIntent.status);
            console.error(
              "❌ Latest charge:",
              paymentIntent.latest_charge ? "EXISTS" : "MISSING"
            );
            throw new Error("Charge ID missing from Payment Intent");
          }

          console.log(`🔍 Retrieving charge from Stripe...`);
          let charge;
          try {
            charge = await stripeSecret.instance.charges.retrieve(
              paymentIntent.latest_charge as string
            );
            console.log(
              `✅ Charge retrieved: status=${charge.status}, amount=${charge.amount}, currency=${charge.currency}`
            );
          } catch (chargeError) {
            console.error("❌ Error retrieving charge from Stripe");
            console.error(
              "❌ Error type:",
              chargeError instanceof Error
                ? chargeError.constructor.name
                : typeof chargeError
            );
            console.error(
              "❌ Error message:",
              chargeError instanceof Error
                ? chargeError.message
                : String(chargeError)
            );
            console.error(
              "❌ Charge ID:",
              paymentIntent.latest_charge ? "EXISTS" : "MISSING"
            );
            throw new Error("Failed to retrieve charge");
          }

          // Check charge status - should be succeeded
          if (charge.status !== "succeeded") {
            console.error(
              `❌ Charge status is ${charge.status}, not 'succeeded'. Cannot process transfer yet.`
            );
            console.error(
              `❌ Charge details: paid=${charge.paid}, refunded=${charge.refunded}, captured=${charge.captured}`
            );
            console.error(
              `❌ Charge failure code: ${charge.failure_code || "NONE"}`
            );
            console.error(
              `❌ Charge failure message: ${charge.failure_message || "NONE"}`
            );
            throw new Error(
              `Charge status is ${charge.status}, cannot get balance transaction.`
            );
          }

          console.log(`✅ Charge status validated: succeeded`);

          let balanceTransactionId = charge.balance_transaction as
            | string
            | null;

          // If balance_transaction ID is missing, try listing balance transactions by source (charge ID)
          if (!balanceTransactionId) {
            console.warn(
              `⚠️ Charge ${charge.id} status is 'succeeded', but balance_transaction ID initially missing. Trying list fallback.`
            );
            const btList = await stripeSecret.instance.balanceTransactions.list(
              {
                source: charge.id,
                limit: 1, // We only expect one balance transaction per charge
              }
            );

            if (btList.data.length > 0) {
              balanceTransactionId = btList.data[0].id;
              console.log(
                `✅ Fallback successful: Found balance transaction ${balanceTransactionId} via list.`
              );
            } else {
              // Optional: Add a small delay and retry the list once more, as a final check
              console.warn(
                `⚠️ Fallback list failed for charge ${charge.id}. Waiting 1 second and retrying list.`
              );
              await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
              const finalList =
                await stripeSecret.instance.balanceTransactions.list({
                  source: charge.id,
                  limit: 1,
                });
              if (finalList.data.length > 0) {
                balanceTransactionId = finalList.data[0].id;
                console.log(
                  `✅ Fallback successful on retry: Found balance transaction ${balanceTransactionId} via list.`
                );
              } else {
                console.error(
                  `❌ Fallback failed again: No balance transaction found via list for charge ${charge.id}.`
                );
                throw new Error(
                  "Balance Transaction ID missing and list fallback failed"
                );
              }
            }
          }

          // Ensure we have the ID before proceeding
          if (!balanceTransactionId) {
            // Should not happen if the logic above worked, but as a safeguard:
            throw new Error("Could not retrieve Balance Transaction ID");
          }

          // Retrieve the Balance Transaction using the obtained ID
          console.log(`🔍 Retrieving balance transaction from Stripe...`);
          let balanceTransaction;
          try {
            balanceTransaction =
              await stripeSecret.instance.balanceTransactions.retrieve(
                balanceTransactionId
              );
            console.log(
              `✅ Balance transaction retrieved: type=${balanceTransaction.type}, amount=${balanceTransaction.amount}, fee=${balanceTransaction.fee}`
            );
          } catch (btError) {
            console.error(
              "❌ Error retrieving balance transaction from Stripe"
            );
            console.error(
              "❌ Error type:",
              btError instanceof Error
                ? btError.constructor.name
                : typeof btError
            );
            console.error(
              "❌ Error message:",
              btError instanceof Error ? btError.message : String(btError)
            );
            console.error(
              "❌ Balance transaction ID:",
              balanceTransactionId ? "EXISTS" : "MISSING"
            );
            throw new Error("Failed to retrieve balance transaction");
          }

          const stripeFee = balanceTransaction.fee; // Actual fee in cents
          console.log(
            `💰 Stripe fee from balance transaction: ${stripeFee} cents`
          );

          // Update order with Stripe fee (store in cents)
          try {
            console.log(
              `💾 Updating order with Stripe fee: ${stripeFee} cents`
            );
            await db.order.update({
              where: { id: order.id },
              data: { stripeFee: stripeFee }, // Store fee in cents
            });
            console.log(`✅ Order updated with Stripe fee successfully`);
          } catch (updateError) {
            console.error("❌ Error updating order with Stripe fee");
            console.error(
              "❌ Error type:",
              updateError instanceof Error
                ? updateError.constructor.name
                : typeof updateError
            );
            console.error(
              "❌ Error message:",
              updateError instanceof Error
                ? updateError.message
                : String(updateError)
            );
            console.error("❌ Order ID:", order.id ? "EXISTS" : "MISSING");
            // Don't throw - fee update is not critical, we can continue
          }

          // Get amounts from metadata (already in cents)
          const totalAmountInCents = order.totalAmount;
          const platformFeeInCents = parseInt(
            session.metadata.platformFee || "0"
          );
          const sellerCurrency = session.metadata.sellerCurrency || "usd"; // Get seller's currency from metadata
          const originalPrice = parseInt(session.metadata.originalPrice || "0"); // Get original price in seller's currency

          // Get the current exchange rate from the database
          console.log(
            `🔍 Fetching exchange rate: ${product.currency.toUpperCase()} -> ${sellerCurrency.toUpperCase()}`
          );
          let exchangeRate;
          try {
            exchangeRate = await db.exchangeRate.findUnique({
              where: {
                baseCurrency_targetCurrency: {
                  baseCurrency: product.currency.toUpperCase(), // Use product's currency as base
                  targetCurrency: sellerCurrency.toUpperCase(),
                },
              },
            });
            if (exchangeRate) {
              console.log(
                `✅ Exchange rate found: ${exchangeRate.rate} (last updated: ${exchangeRate.lastUpdated ? "EXISTS" : "MISSING"})`
              );
            } else {
              console.warn(
                `⚠️ Exchange rate not found, using default rate of 1.0`
              );
            }
          } catch (erError) {
            console.error("❌ Error fetching exchange rate from database");
            console.error(
              "❌ Error type:",
              erError instanceof Error
                ? erError.constructor.name
                : typeof erError
            );
            console.error(
              "❌ Error message:",
              erError instanceof Error ? erError.message : String(erError)
            );
            console.warn("⚠️ Using default exchange rate of 1.0");
            exchangeRate = null;
          }

          // Calculate amount to transfer (ensure at least 1 cent)
          // The total amount is what the customer paid, we need to deduct our platform fee and Stripe's fee
          const amountToSeller = Math.max(
            1,
            totalAmountInCents -
              platformFeeInCents - // Platform fee in cents
              stripeFee // Stripe fee in cents
          );

          console.log(
            `💰 Transfer calculation (in ${product.currency.toUpperCase()}):`
          );
          console.log(`- Total amount: ${totalAmountInCents}`);
          console.log(`- Stripe fee: ${stripeFee}`);
          console.log(`- Platform fee: ${platformFeeInCents}`);
          console.log(`- Amount to seller: ${amountToSeller}`);
          console.log(`- Seller currency: ${sellerCurrency}`);
          console.log(`- Original price: ${originalPrice} ${sellerCurrency}`);
          console.log(`- Exchange rate: ${exchangeRate?.rate || 1}`);

          // Determine hold period based on seller account age and trust status
          const holdPeriodDays = await determineHoldPeriod(
            session.metadata.sellerId,
            product.isDigital
          );
          console.log(
            `⏰ Hold period determined: ${holdPeriodDays} days for ${product.isDigital ? "digital" : "physical"} product`
          );

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

          // Create transfer (wrap in try-catch so emails still send if transfer fails)
          let transferId: string | null = null;
          try {
            console.log(`💸 Creating transfer to seller...`);
            console.log(
              `📋 Transfer params: amount=${amountToSeller}, currency=${product.currency.toLowerCase()}, destination=${product.seller.connectedAccountId ? "EXISTS" : "MISSING"}`
            );
            console.log(
              `📋 Transfer params: holdPeriod=${holdPeriodDays} days, source_transaction=${charge.id ? "EXISTS" : "MISSING"}`
            );
            const transfer =
              await stripeSecret.instance.transfers.create(transferParams);
            transferId = transfer.id;
            console.log(
              `✅ Created ${holdPeriodDays > 0 ? "scheduled" : "immediate"} transfer successfully`
            );
            console.log(
              `💰 Transfer details: id=${transfer.id ? "EXISTS" : "MISSING"}, amount=${transfer.amount}, currency=${transfer.currency}`
            );
          } catch (transferError) {
            console.error("❌ CRITICAL: Error creating transfer to seller");
            console.error(
              "❌ Error type:",
              transferError instanceof Error
                ? transferError.constructor.name
                : typeof transferError
            );
            console.error(
              "❌ Error message:",
              transferError instanceof Error
                ? transferError.message
                : String(transferError)
            );
            if (transferError instanceof Error && "code" in transferError) {
              console.error(
                "❌ Stripe error code:",
                (transferError as any).code
              );
            }
            console.error(
              "❌ Transfer failed but order was created. Manual intervention required!"
            );
            console.error("❌ Order ID:", order.id ? "EXISTS" : "MISSING");
            console.error(
              "❌ Amount to transfer:",
              amountToSeller,
              product.currency
            );
            console.error(
              "❌ Seller connected account:",
              product.seller.connectedAccountId ? "EXISTS" : "MISSING"
            );
            console.error("❌ Charge ID:", charge.id ? "EXISTS" : "MISSING");
            console.error(
              "❌ Transfer group:",
              transferParams.transfer_group ? "EXISTS" : "MISSING"
            );

            // Log transfer failure to database
            logError({
              code: "TRANSFER_FAILED",
              userId:
                paymentIntent.metadata.userId &&
                paymentIntent.metadata.userId !== "guest"
                  ? paymentIntent.metadata.userId
                  : undefined,
              route: "/api/stripe/webhooks",
              method: "POST",
              error: transferError,
              metadata: {
                eventType: event.type,
                orderId: order.id,
                paymentIntentId: paymentIntent.id,
                sellerId: product.seller.userId,
                amountToSeller,
                currency: product.currency,
                connectedAccountId: product.seller.connectedAccountId,
                chargeId: charge.id,
                transferGroup: transferParams.transfer_group,
                note: "Order was created but transfer to seller failed - manual intervention required",
              },
            });
            // Continue processing - emails should still be sent even if transfer fails
          }

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

          // Update order with transfer ID (if created), currency info, exchange rate, and finalize status
          try {
            console.log(`💾 Updating order with final details...`);
            console.log(
              `📋 Update data: transferId=${transferId ? "EXISTS" : "MISSING"}, status=${orderStatus}, currency=${sellerCurrency}`
            );
            await db.order.update({
              where: { id: order.id },
              data: {
                stripeTransferId: transferId, // Will be null if transfer failed
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
            console.log(`✅ Order updated with final details successfully`);
          } catch (updateError) {
            console.error("❌ Error updating order with final details");
            console.error(
              "❌ Error type:",
              updateError instanceof Error
                ? updateError.constructor.name
                : typeof updateError
            );
            console.error(
              "❌ Error message:",
              updateError instanceof Error
                ? updateError.message
                : String(updateError)
            );
            console.error("❌ Order ID:", order.id ? "EXISTS" : "MISSING");
            // Don't throw - order is already created, this is just finalization
          }

          // Decrypt shipping address once for use in both emails
          let decryptedShippingAddress = null;
          if (order.encryptedShippingAddress) {
            try {
              const decryptedAddress = decryptOrderData(
                order.encryptedShippingAddress,
                order.shippingAddressIV,
                order.shippingAddressSalt
              );
              decryptedShippingAddress = JSON.parse(decryptedAddress);
            } catch (error) {
              console.error("❌ Error parsing shipping address:", error);
              decryptedShippingAddress = null;
            }
          }

          // Send confirmation email to buyer (separate try-catch so seller email still sends if this fails)
          try {
            console.log(`📧 Attempting to send buyer confirmation email...`);
            // Decrypt the buyer's email
            let buyerEmail: string;
            try {
              buyerEmail = decryptOrderData(
                order.encryptedBuyerEmail,
                order.buyerEmailIV,
                order.buyerEmailSalt
              );
              const emailPrefix = buyerEmail.substring(0, 3);
              const emailDomain = buyerEmail.includes("@")
                ? buyerEmail.split("@")[1]?.substring(0, 3)
                : "***";
              console.log(
                `🔓 Buyer email decrypted: ${emailPrefix}***@${emailDomain}***`
              );
            } catch (decryptError) {
              console.error(
                "❌ Error decrypting buyer email for email sending"
              );
              console.error(
                "❌ Error type:",
                decryptError instanceof Error
                  ? decryptError.constructor.name
                  : typeof decryptError
              );
              console.error(
                "❌ Error message:",
                decryptError instanceof Error
                  ? decryptError.message
                  : String(decryptError)
              );
              console.error(
                "❌ Encrypted email data:",
                order.encryptedBuyerEmail ? "EXISTS" : "MISSING"
              );
              console.error(
                "❌ Email IV:",
                order.buyerEmailIV ? "EXISTS" : "MISSING"
              );
              console.error(
                "❌ Email salt:",
                order.buyerEmailSalt ? "EXISTS" : "MISSING"
              );
              throw decryptError;
            }

            if (!buyerEmail || buyerEmail.trim() === "") {
              console.error(
                "❌ Buyer email is empty after decryption, cannot send email"
              );
              console.error("❌ Order ID:", order.id ? "EXISTS" : "MISSING");
            } else {
              // Send buyer email
              const { data: buyerEmailData, error: buyerEmailError } =
                await resend.emails.send({
                  from: "Yarnnu <noreply@yarnnu.com>",
                  to: [buyerEmail],
                  subject: product.isDigital
                    ? "Your digital product is ready!"
                    : "Your order has been confirmed!",
                  react: ProductEmail({
                    link:
                      product.isDigital && product.productFile
                        ? product.productFile
                        : undefined,
                    isDigital: product.isDigital,
                    orderDetails: {
                      productName: product.name,
                      orderId: order.id,
                      batchNumber: order.batchNumber || undefined,
                      shippingAddress: decryptedShippingAddress
                        ? {
                            street: decryptedShippingAddress.line1 || "",
                            city: decryptedShippingAddress.city || "",
                            state: decryptedShippingAddress.state || "",
                            zipCode: decryptedShippingAddress.postal_code || "",
                            country: decryptedShippingAddress.country || "",
                          }
                        : undefined,
                    },
                  }),
                });

              if (buyerEmailError) {
                console.error(
                  "❌ Error sending buyer confirmation email:",
                  buyerEmailError
                );
              } else {
                console.log("✅ Buyer confirmation email sent successfully");
              }
            }
          } catch (buyerEmailError) {
            console.error(
              "❌ Error decrypting buyer email or sending buyer email:",
              buyerEmailError
            );
            // Continue to seller email even if buyer email fails
          }

          // Send seller notification email (separate try-catch so it always attempts to send)
          try {
            if (!product.seller.user.email) {
              console.error("❌ Seller email not found");
            } else {
              // Decrypt buyer name for seller email (handle errors gracefully)
              let buyerName = "Customer";
              try {
                buyerName =
                  decryptOrderData(
                    order.encryptedBuyerName,
                    order.buyerNameIV,
                    order.buyerNameSalt
                  ) || "Customer";
              } catch (error) {
                console.error(
                  "❌ Error decrypting buyer name for seller email:",
                  error
                );
                buyerName = "Customer"; // Fallback to generic name
              }

              const { data: sellerEmailData, error: sellerEmailError } =
                await resend.emails.send({
                  from: "Yarnnu <noreply@yarnnu.com>",
                  to: [product.seller.user.email],
                  subject: `New Sale Alert! Order #${order.id}`,
                  react: SellerOrderEmail({
                    orderDetails: {
                      productName: product.name,
                      orderId: order.id,
                      batchNumber: order.batchNumber || undefined,
                      quantity: order.quantity,
                      totalAmount: order.totalAmount,
                      buyerName: buyerName,
                      shippingAddress: decryptedShippingAddress
                        ? {
                            street: decryptedShippingAddress.line1 || "",
                            city: decryptedShippingAddress.city || "",
                            state: decryptedShippingAddress.state || "",
                            zipCode: decryptedShippingAddress.postal_code || "",
                            country: decryptedShippingAddress.country || "",
                          }
                        : undefined,
                      orderInstructions: order.orderInstructions || undefined,
                    },
                  }),
                });

              if (sellerEmailError) {
                console.error(
                  "❌ Error sending seller notification email:",
                  sellerEmailError
                );
              } else {
                console.log("✅ Seller notification email sent successfully");
              }
            }
          } catch (sellerEmailError) {
            console.error(
              "❌ Error sending seller notification email:",
              sellerEmailError
            );
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

            console.log(
              `✅ Updated product and seller stats for order ${order.id}`
            );
          } catch (statsError) {
            console.error(
              "⚠️ Error updating product/seller stats:",
              statsError
            );
          }

          return NextResponse.json({ success: true, orderId: order.id });
        }
        case "account.updated": {
          const account = event.data.object as Stripe.Account;
          const logContext: Record<string, any> = {
            event: "account.updated",
            stripeAccountId: account.id,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            timestamp: new Date().toISOString(),
          };

          console.log(
            `[STRIPE_WEBHOOK] Account updated event received`,
            logContext
          );

          // Check if the account is fully onboarded (can accept charges and payouts)
          if (account.charges_enabled && account.payouts_enabled) {
            try {
              // Find the seller with this connected account ID
              const seller = await db.seller.findUnique({
                where: { connectedAccountId: account.id },
                select: { id: true, userId: true, stripeConnected: true },
              });

              if (!seller) {
                console.warn(`[STRIPE_WEBHOOK] No seller found for account`, {
                  ...logContext,
                  note: "Account may not be associated with a seller yet",
                });
                return NextResponse.json({ received: true });
              }

              logContext.sellerId = seller.id;
              logContext.sellerUserId = seller.userId;
              logContext.currentStripeConnected = seller.stripeConnected;

              if (!seller.stripeConnected) {
                console.log(
                  `[STRIPE_WEBHOOK] Updating seller stripe connection status`,
                  logContext
                );

                // Update in a transaction to ensure consistency
                try {
                  await db.$transaction(async (tx) => {
                    // Update the seller's stripeConnected status
                    await tx.seller.update({
                      where: { id: seller.id },
                      data: { stripeConnected: true },
                    });

                    // Mark payment_setup step as completed
                    await tx.onboardingStep.upsert({
                      where: {
                        sellerId_stepKey: {
                          sellerId: seller.id,
                          stepKey: "payment_setup",
                        },
                      },
                      update: {
                        completed: true,
                        completedAt: new Date(),
                      },
                      create: {
                        sellerId: seller.id,
                        stepKey: "payment_setup",
                        completed: true,
                        completedAt: new Date(),
                      },
                    });
                  });

                  // Recalculate isFullyActivated (outside transaction)
                  try {
                    await updateOnboardingStep(
                      seller.id,
                      "payment_setup",
                      true
                    );
                    console.log(
                      `[STRIPE_WEBHOOK] isFullyActivated recalculated`,
                      logContext
                    );
                  } catch (recalcError) {
                    console.warn(
                      `[STRIPE_WEBHOOK] Failed to recalculate isFullyActivated (non-critical)`,
                      {
                        ...logContext,
                        error:
                          recalcError instanceof Error
                            ? recalcError.message
                            : String(recalcError),
                      }
                    );
                  }

                  console.log(
                    `[STRIPE_WEBHOOK] Seller stripe connection updated successfully`,
                    {
                      ...logContext,
                      status: "SUCCESS",
                    }
                  );
                } catch (dbError) {
                  const errorDetails = {
                    ...logContext,
                    error:
                      dbError instanceof Error
                        ? dbError.message
                        : String(dbError),
                    stack: dbError instanceof Error ? dbError.stack : undefined,
                    status: "FAILED",
                  };
                  console.error(
                    `[STRIPE_WEBHOOK] Failed to update seller stripe connection`,
                    errorDetails
                  );
                  // Don't throw - webhook should still return success to Stripe
                }
              } else {
                console.log(
                  `[STRIPE_WEBHOOK] Seller already marked as connected, skipping update`,
                  logContext
                );
              }
            } catch (error) {
              const errorDetails = {
                ...logContext,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                status: "FAILED",
              };
              console.error(
                `[STRIPE_WEBHOOK] Error processing account.updated event`,
                errorDetails
              );
              // Don't throw - webhook should still return success to Stripe
            }
          } else {
            console.log(
              `[STRIPE_WEBHOOK] Account not fully onboarded yet`,
              logContext
            );
          }

          return NextResponse.json({ received: true });
        }
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log(`✅ Processing payment_intent.succeeded`);
          console.log(
            `📋 Payment intent details: metadata=${paymentIntent.metadata ? "EXISTS" : "MISSING"}, status=${paymentIntent.status}, amount=${paymentIntent.amount}, currency=${paymentIntent.currency}`
          );

          if (!paymentIntent.metadata) {
            console.error("❌ Payment intent completed without metadata");
            console.error("❌ Payment intent status:", paymentIntent.status);
            console.error("❌ Payment intent amount:", paymentIntent.amount);
            throw new Error("Metadata missing from payment intent");
          }

          console.log(
            `📋 Metadata check: productId=${paymentIntent.metadata.productId ? "EXISTS" : "MISSING"}, sellerId=${paymentIntent.metadata.sellerId ? "EXISTS" : "MISSING"}, userId=${paymentIntent.metadata.userId ? "EXISTS" : "MISSING"}`
          );

          // Fetch product details using metadata
          console.log(
            `🔍 Fetching product with ID: ${paymentIntent.metadata.productId ? "EXISTS" : "MISSING"}`
          );
          let product;
          try {
            product = await db.product.findUnique({
              where: { id: paymentIntent.metadata.productId },
              include: {
                seller: {
                  include: {
                    user: true,
                  },
                },
              },
            });
            console.log(
              `📦 Product fetch result: ${product ? "FOUND" : "NOT_FOUND"}`
            );
          } catch (dbError) {
            console.error(
              "❌ Database error fetching product:",
              dbError instanceof Error ? dbError.message : String(dbError)
            );
            console.error(
              "❌ Product ID from metadata:",
              paymentIntent.metadata.productId ? "EXISTS" : "MISSING"
            );
            throw new Error("Failed to fetch product from database");
          }

          if (!product) {
            console.error("❌ Product not found in database");
            console.error(
              "❌ Product ID from metadata:",
              paymentIntent.metadata.productId ? "EXISTS" : "MISSING"
            );
            throw new Error("Product not found");
          }

          if (!product.seller) {
            console.error("❌ Product found but seller is missing");
            console.error("❌ Product ID:", product.id ? "EXISTS" : "MISSING");
            throw new Error("Seller not found for product");
          }

          if (!product.seller.connectedAccountId) {
            console.error(
              "❌ Seller found but connected account ID is missing"
            );
            console.error(
              "❌ Seller ID:",
              product.seller.id ? "EXISTS" : "MISSING"
            );
            console.error(
              "❌ Seller user ID:",
              product.seller.userId ? "EXISTS" : "MISSING"
            );
            throw new Error("Seller connected account not found");
          }

          console.log(
            `✅ Product and seller validation passed: product=${product.id ? "EXISTS" : "MISSING"}, seller=${product.seller.id ? "EXISTS" : "MISSING"}, connectedAccount=${product.seller.connectedAccountId ? "EXISTS" : "MISSING"}`
          );

          // Create preliminary order
          // Get buyer email from multiple sources (most reliable first)
          // For guest checkouts, Stripe should have the email in receipt_email or customer_details
          let buyerEmail =
            paymentIntent.metadata.buyerEmail ||
            paymentIntent.receipt_email ||
            "";
          let buyerName = paymentIntent.metadata.buyerName || "";

          // If no email from metadata or receipt_email, try to get it from the customer
          if (!buyerEmail && paymentIntent.customer) {
            try {
              const customer = await stripeSecret.instance.customers.retrieve(
                paymentIntent.customer as string
              );
              if (customer && !customer.deleted) {
                buyerEmail = customer.email || buyerEmail;
                buyerName = customer.name || buyerName;
              }
            } catch (error) {
              console.error("❌ Error retrieving customer:", error);
            }
          }

          // Log email retrieval for debugging
          if (!buyerEmail || buyerEmail.trim() === "") {
            console.warn(
              "⚠️ WARNING: Buyer email is empty or missing for order. Email confirmation will not be sent."
            );
            console.warn(
              "⚠️ Metadata buyerEmail:",
              paymentIntent.metadata.buyerEmail ? "EXISTS" : "MISSING"
            );
            console.warn(
              "⚠️ Receipt email:",
              paymentIntent.receipt_email ? "EXISTS" : "MISSING"
            );
            console.warn(
              "⚠️ Customer ID:",
              paymentIntent.customer ? "EXISTS" : "MISSING"
            );
            console.warn(
              "⚠️ Customer object:",
              paymentIntent.customer ? "EXISTS" : "MISSING"
            );
          } else {
            const emailPrefix = buyerEmail.substring(0, 3);
            const emailDomain = buyerEmail.includes("@")
              ? buyerEmail.split("@")[1]?.substring(0, 3)
              : "***";
            const emailSource = paymentIntent.metadata.buyerEmail
              ? "metadata"
              : paymentIntent.receipt_email
                ? "receipt_email"
                : "customer";
            console.log(
              `📧 Buyer email retrieved: ${emailPrefix}***@${emailDomain}*** (from ${emailSource})`
            );
          }

          console.log(`📋 Buyer name: ${buyerName ? "EXISTS" : "MISSING"}`);

          // Use shipping address from metadata if provided
          let shippingAddress = null;
          if (paymentIntent.metadata.shippingAddressProvided === "true") {
            // Shipping address was collected on our checkout page and stored in metadata
            if (paymentIntent.metadata.shippingAddress) {
              try {
                const addressData = JSON.parse(
                  paymentIntent.metadata.shippingAddress
                );
                shippingAddress = JSON.stringify({
                  line1: addressData.street || "",
                  city: addressData.city || "",
                  state: addressData.state || "",
                  postal_code: addressData.postal || "",
                  country: addressData.country || "",
                });
              } catch (error) {
                console.error(
                  "❌ Error parsing shipping address from metadata:",
                  error
                );
                shippingAddress = JSON.stringify({
                  line1: "Address collected on checkout page",
                  city: "",
                  state: "",
                  postal_code: "",
                  country: "",
                });
              }
            } else {
              // Fallback to placeholder if no address in metadata
              shippingAddress = JSON.stringify({
                line1: "Address collected on checkout page",
                city: "",
                state: "",
                postal_code: "",
                country: "",
              });
            }
          }

          const {
            encrypted: encryptedBuyerEmail,
            iv: buyerEmailIV,
            salt: buyerEmailSalt,
          } = encryptOrderData(buyerEmail);
          const {
            encrypted: encryptedBuyerName,
            iv: buyerNameIV,
            salt: buyerNameSalt,
          } = encryptOrderData(buyerName);
          const {
            encrypted: encryptedShippingAddress,
            iv: shippingAddressIV,
            salt: shippingAddressSalt,
          } = shippingAddress
            ? encryptOrderData(shippingAddress)
            : { encrypted: "", iv: "", salt: "" };

          // Get discount information from metadata
          const discountCodeId = paymentIntent.metadata.discountCodeId;
          const discountCodeUsed = paymentIntent.metadata.discountCodeUsed;
          const discountAmount = parseInt(
            paymentIntent.metadata.discountAmount || "0"
          );
          const saleDiscount = parseInt(
            paymentIntent.metadata.saleDiscount || "0"
          );
          const finalOrderAmount = parseInt(
            paymentIntent.metadata.finalOrderAmount || "0"
          );

          // Retrieve order instructions from database (stored separately from Stripe)
          let orderInstructionsText: string | null = null;
          try {
            const instructionsRecord = await db.orderInstructions.findUnique({
              where: { paymentIntentId: paymentIntent.id },
            });
            if (instructionsRecord) {
              orderInstructionsText = instructionsRecord.instructions;
              console.log(`✅ Retrieved order instructions for payment intent: ${paymentIntent.id}`);
            }
          } catch (instructionsError) {
            console.error("❌ Error retrieving order instructions:", instructionsError);
            // Continue without instructions - not critical
          }

          const preliminaryOrderData = {
            userId:
              paymentIntent.metadata.userId &&
              paymentIntent.metadata.userId !== "guest"
                ? paymentIntent.metadata.userId
                : null, // Use null for guest checkouts
            encryptedBuyerEmail,
            buyerEmailIV,
            buyerEmailSalt,
            encryptedBuyerName,
            buyerNameIV,
            buyerNameSalt,
            sellerId: paymentIntent.metadata.sellerId || "",
            shopName: product.seller?.shopName || "",
            productId: paymentIntent.metadata.productId || "",
            productName: product.name,
            quantity: parseInt(paymentIntent.metadata.quantity || "1"),
            totalAmount:
              finalOrderAmount ||
              parseInt(paymentIntent.metadata.productPrice || "0") +
                parseInt(paymentIntent.metadata.shippingAndHandling || "0"),
            productPrice: parseInt(paymentIntent.metadata.productPrice || "0"),
            shippingCost: parseInt(
              paymentIntent.metadata.shippingAndHandling || "0"
            ),
            stripeFee: 0, // Placeholder
            platformFee: parseInt(paymentIntent.metadata.platformFee || "0"), // Store platform fee from metadata
            isDigital: product.isDigital || false,
            status: product.isDigital
              ? OrderStatus.COMPLETED
              : OrderStatus.PENDING_TRANSFER,
            paymentStatus: PaymentStatus.PAID,
            stripeSessionId: paymentIntent.id, // Use payment intent ID as session ID
            stripeTransferId: null,
            encryptedShippingAddress,
            shippingAddressIV,
            shippingAddressSalt,
            discount:
              discountAmount > 0
                ? JSON.stringify({
                    discountCodeId,
                    discountCodeUsed,
                    discountAmount,
                    saleDiscount,
                  })
                : null,
            discountCodeId: discountCodeId || null,
            discountCodeAmount: discountAmount,
            discountCodeUsed: discountCodeUsed || null,
            completedAt: product.isDigital ? new Date() : null,
            taxAmount: 0, // Payment intents don't have tax details
            taxBreakdown: null,
            taxExempt: paymentIntent.metadata.taxExempt === "true",
            taxCategory: paymentIntent.metadata.taxCategory || null,
            taxCode: product.taxCode || null,
            taxJurisdiction: null,
            taxRate: null,
            taxType: null,
            batchNumber: product.batchNumber || null,
            orderInstructions: orderInstructionsText, // Order instructions from buyer (retrieved from database)
          };

          let order;
          try {
            order = await db.order.create({ data: preliminaryOrderData });
            console.log(`✅ Created preliminary order: ${order.id}`);
            
            // Clean up temporary order instructions record after saving to order
            if (orderInstructionsText) {
              try {
                await db.orderInstructions.delete({
                  where: { paymentIntentId: paymentIntent.id },
                });
                console.log(`✅ Cleaned up temporary order instructions for payment intent: ${paymentIntent.id}`);
              } catch (cleanupError) {
                console.error("❌ Error cleaning up order instructions:", cleanupError);
                // Non-critical error, continue
              }
            }
          } catch (orderError) {
            // Log order creation failure
            logError({
              code: "ORDER_CREATE_FAILED",
              userId:
                paymentIntent.metadata.userId &&
                paymentIntent.metadata.userId !== "guest"
                  ? paymentIntent.metadata.userId
                  : undefined,
              route: "/api/stripe/webhooks",
              method: "POST",
              error: orderError,
              metadata: {
                eventType: event.type,
                paymentIntentId: paymentIntent.id,
                productId: paymentIntent.metadata.productId,
                sellerId: paymentIntent.metadata.sellerId,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
              },
            });
            throw orderError; // Re-throw to be caught by outer handler
          }
          console.log(
            `💰 Platform fee stored: ${preliminaryOrderData.platformFee} cents (${(preliminaryOrderData.platformFee / 100).toFixed(2)} ${paymentIntent.currency?.toUpperCase() || "USD"})`
          );

          // Create discount usage record if discount code was used
          if (discountCodeId && discountAmount > 0) {
            try {
              await db.discountCodeUsage.create({
                data: {
                  discountCodeId,
                  orderId: order.id,
                  userId:
                    paymentIntent.metadata.userId &&
                    paymentIntent.metadata.userId !== "guest"
                      ? paymentIntent.metadata.userId
                      : null, // Use null for guest checkouts
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

              console.log(
                `✅ Created discount usage record for code: ${discountCodeUsed}`
              );
            } catch (error) {
              console.error("❌ Error creating discount usage record:", error);
            }
          }

          // Since we removed automatic transfer, we need to create the transfer manually
          // This ensures we transfer the correct amount after deducting both platform fee and Stripe fee

          // Get the Stripe fee from the balance transaction and store charge ID for transfer
          let stripeFee = 0;
          let chargeId: string | null = null;

          try {
            // Add a small delay to ensure balance transaction is available
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // First, try to get the charge from the payment intent
            const charges = await stripeSecret.instance.charges.list({
              payment_intent: paymentIntent.id,
              limit: 1,
            });

            if (charges.data.length > 0) {
              const charge = charges.data[0];
              chargeId = charge.id; // Store charge ID for transfer
              console.log(`💰 Found charge: ${charge.id}`);

              // Get the balance transaction from the charge
              if (charge.balance_transaction) {
                const balanceTransaction =
                  await stripeSecret.instance.balanceTransactions.retrieve(
                    charge.balance_transaction as string
                  );
                stripeFee = balanceTransaction.fee;
                console.log(
                  `💰 Stripe fee from balance transaction: ${stripeFee} cents`
                );
              } else {
                console.warn(
                  `⚠️ No balance_transaction found on charge ${charge.id}`
                );
                // Try to get balance transaction by listing
                const btList =
                  await stripeSecret.instance.balanceTransactions.list({
                    source: charge.id,
                    limit: 1,
                  });

                if (btList.data.length > 0) {
                  const balanceTransaction =
                    await stripeSecret.instance.balanceTransactions.retrieve(
                      btList.data[0].id
                    );
                  stripeFee = balanceTransaction.fee;
                  console.log(
                    `💰 Stripe fee from list fallback: ${stripeFee} cents`
                  );
                }
              }
            } else {
              console.warn(
                `⚠️ No charges found for payment intent ${paymentIntent.id}`
              );
            }
          } catch (error) {
            console.error(`❌ Error retrieving Stripe fee:`, error);
            // Use a default Stripe fee estimate if we can't retrieve it
            // For a $20.99 transaction, Stripe typically charges around $0.63 (2.9% + 30¢)
            stripeFee = Math.round(order.totalAmount * 0.029 + 30); // 2.9% + 30¢
            console.log(`💰 Using estimated Stripe fee: ${stripeFee} cents`);
          }

          // Update order with fee information
          await db.order.update({
            where: { id: order.id },
            data: {
              stripeFee: stripeFee, // Store Stripe fee in cents
            },
          });

          // Calculate the correct amount to transfer to the seller
          const totalAmountInCents = order.totalAmount;
          const platformFeeInCents = parseInt(
            paymentIntent.metadata.platformFee || "0"
          );
          const amountToSeller = Math.max(
            1,
            totalAmountInCents - platformFeeInCents - stripeFee
          );

          console.log(`💰 Transfer calculation:`);
          console.log(`- Total amount: ${totalAmountInCents} cents`);
          console.log(`- Platform fee: ${platformFeeInCents} cents`);
          console.log(`- Stripe fee: ${stripeFee} cents`);
          console.log(`- Amount to seller: ${amountToSeller} cents`);

          // Create transfer to seller
          // CRITICAL: Use source_transaction to transfer directly from the charge
          // This prevents "insufficient funds" errors by transferring from the charge itself
          // rather than requiring funds to be available in the platform balance first
          try {
            if (!chargeId) {
              throw new Error(
                "Charge ID not found - cannot create transfer without source_transaction"
              );
            }

            const transferParams: Stripe.TransferCreateParams = {
              amount: amountToSeller,
              currency: paymentIntent.currency,
              destination: product.seller.connectedAccountId,
              transfer_group: paymentIntent.id,
              source_transaction: chargeId, // CRITICAL: Transfer directly from charge
              metadata: {
                orderId: order.id,
                paymentIntentId: paymentIntent.id,
                platformFee: platformFeeInCents.toString(),
                stripeFee: stripeFee.toString(),
                totalAmount: totalAmountInCents.toString(),
              },
            };

            const transfer =
              await stripeSecret.instance.transfers.create(transferParams);

            // Update order with transfer ID
            await db.order.update({
              where: { id: order.id },
              data: { stripeTransferId: transfer.id },
            });

            console.log(
              `✅ Created transfer to seller: ${transfer.id} for ${amountToSeller} cents`
            );
          } catch (transferError) {
            console.error(
              "❌ CRITICAL: Error creating transfer to seller:",
              transferError
            );
            console.error(
              "❌ Transfer failed but order was created. Manual intervention required!"
            );
            console.error("❌ Order ID:", order.id);
            console.error(
              "❌ Amount to transfer:",
              amountToSeller,
              paymentIntent.currency
            );
            console.error(
              "❌ Seller connected account:",
              product.seller.connectedAccountId
            );
            console.error("❌ Charge ID:", chargeId);
            // Don't throw here, as the order is already created and emails should still be sent
          }

          // Determine order status based on product type
          let orderStatus: OrderStatus;
          if (product.isDigital) {
            orderStatus = OrderStatus.COMPLETED;
          } else {
            orderStatus = OrderStatus.PENDING;
          }

          // Update order with final status
          await db.order.update({
            where: { id: order.id },
            data: {
              status: orderStatus,
              paymentStatus: PaymentStatus.PAID,
              completedAt: product.isDigital ? new Date() : null,
            },
          });

          // Decrypt shipping address once for use in both emails
          let decryptedShippingAddress = null;
          if (order.encryptedShippingAddress) {
            try {
              const decryptedAddress = decryptOrderData(
                order.encryptedShippingAddress,
                order.shippingAddressIV,
                order.shippingAddressSalt
              );
              decryptedShippingAddress = JSON.parse(decryptedAddress);
            } catch (error) {
              console.error("❌ Error parsing shipping address:", error);
              decryptedShippingAddress = null;
            }
          }

          // Send confirmation email to buyer (separate try-catch so seller email still sends if this fails)
          try {
            const buyerEmail = decryptOrderData(
              order.encryptedBuyerEmail,
              order.buyerEmailIV,
              order.buyerEmailSalt
            );
            console.log(`📧 Buyer email: ${buyerEmail}`);

            if (!buyerEmail || buyerEmail.trim() === "") {
              console.error("❌ Buyer email is empty, cannot send email");
            } else {
              // Send buyer email
              const { data: buyerEmailData, error: buyerEmailError } =
                await resend.emails.send({
                  from: "Yarnnu <noreply@yarnnu.com>",
                  to: [buyerEmail],
                  subject: product.isDigital
                    ? "Your digital product is ready!"
                    : "Your order has been confirmed!",
                  react: ProductEmail({
                    link:
                      product.isDigital && product.productFile
                        ? product.productFile
                        : undefined,
                    isDigital: product.isDigital,
                    orderDetails: {
                      productName: product.name,
                      orderId: order.id,
                      batchNumber: order.batchNumber || undefined,
                      shippingAddress: decryptedShippingAddress
                        ? {
                            street: decryptedShippingAddress.line1 || "",
                            city: decryptedShippingAddress.city || "",
                            state: decryptedShippingAddress.state || "",
                            zipCode: decryptedShippingAddress.postal_code || "",
                            country: decryptedShippingAddress.country || "",
                          }
                        : undefined,
                    },
                  }),
                });

              if (buyerEmailError) {
                console.error(
                  "❌ Error sending buyer confirmation email:",
                  buyerEmailError
                );
              } else {
                console.log("✅ Buyer confirmation email sent successfully");
              }
            }
          } catch (buyerEmailError) {
            console.error(
              "❌ Error decrypting buyer email or sending buyer email:",
              buyerEmailError
            );
            // Continue to seller email even if buyer email fails
          }

          // Send seller notification email (separate try-catch so it always attempts to send)
          try {
            if (!product.seller.user.email) {
              console.error("❌ Seller email not found");
            } else {
              // Decrypt buyer name for seller email (handle errors gracefully)
              let buyerName = "Customer";
              try {
                buyerName =
                  decryptOrderData(
                    order.encryptedBuyerName,
                    order.buyerNameIV,
                    order.buyerNameSalt
                  ) || "Customer";
              } catch (error) {
                console.error(
                  "❌ Error decrypting buyer name for seller email:",
                  error
                );
                buyerName = "Customer"; // Fallback to generic name
              }

              const { data: sellerEmailData, error: sellerEmailError } =
                await resend.emails.send({
                  from: "Yarnnu <noreply@yarnnu.com>",
                  to: [product.seller.user.email],
                  subject: `New Sale Alert! Order #${order.id}`,
                  react: SellerOrderEmail({
                    orderDetails: {
                      productName: product.name,
                      orderId: order.id,
                      batchNumber: order.batchNumber || undefined,
                      quantity: order.quantity,
                      totalAmount: order.totalAmount,
                      buyerName: buyerName,
                      shippingAddress: decryptedShippingAddress
                        ? {
                            street: decryptedShippingAddress.line1 || "",
                            city: decryptedShippingAddress.city || "",
                            state: decryptedShippingAddress.state || "",
                            zipCode: decryptedShippingAddress.postal_code || "",
                            country: decryptedShippingAddress.country || "",
                          }
                        : undefined,
                      orderInstructions: order.orderInstructions || undefined,
                    },
                  }),
                });

              if (sellerEmailError) {
                console.error(
                  "❌ Error sending seller notification email:",
                  sellerEmailError
                );
              } else {
                console.log("✅ Seller notification email sent successfully");
              }
            }
          } catch (sellerEmailError) {
            console.error(
              "❌ Error sending seller notification email:",
              sellerEmailError
            );
          }

          // Update product/seller stats
          try {
            await db.product.update({
              where: { id: paymentIntent.metadata.productId },
              data: {
                numberSold: {
                  increment: parseInt(paymentIntent.metadata.quantity || "1"),
                },
                ...(product.isDigital === false && {
                  stock: {
                    decrement: parseInt(paymentIntent.metadata.quantity || "1"),
                  },
                }),
              },
            });

            await db.seller.update({
              where: { id: product.seller.id },
              data: {
                totalSales: {
                  increment: parseInt(paymentIntent.metadata.quantity || "1"),
                },
              },
            });

            // Create reviews for the order
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 14);

            const seller = await db.seller.findUnique({
              where: { id: product.seller.id },
              select: { userId: true },
            });

            if (!seller) {
              throw new Error("Seller not found");
            }

            // Create product review
            await db.review.create({
              data: {
                orderId: order.id,
                reviewerId: paymentIntent.metadata.userId,
                reviewedId: seller.userId,
                sellerId: product.seller.id,
                productId: paymentIntent.metadata.productId,
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
                reviewerId: paymentIntent.metadata.userId,
                reviewedId: seller.userId,
                sellerId: product.seller.id,
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
                reviewedId: paymentIntent.metadata.userId,
                sellerId: product.seller.id,
                type: "BUYER",
                status: "PENDING",
                expiresAt,
                rating: 0,
              },
            });

            console.log(
              `✅ Updated product and seller stats for order ${order.id}`
            );
          } catch (statsError) {
            console.error(
              "⚠️ Error updating product/seller stats:",
              statsError
            );
          }

          // Delete abandoned cart record since checkout was completed
          try {
            const abandonedCartSessionId =
              paymentIntent.metadata.abandonedCartSessionId;

            if (abandonedCartSessionId) {
              // Use sessionId for precise deletion (preferred method)
              const deletedCarts = await db.abandonedCart.deleteMany({
                where: {
                  sessionId: abandonedCartSessionId,
                  productId: paymentIntent.metadata.productId,
                  recovered: false, // Only delete non-recovered carts
                },
              });

              if (deletedCarts.count > 0) {
                console.log(
                  `✅ Deleted ${deletedCarts.count} abandoned cart record(s) after successful payment (by sessionId)`
                );
              } else {
                console.log(
                  "ℹ️ No abandoned cart records found to delete (by sessionId)"
                );
              }
            } else {
              // Fallback: delete by userId + productId (less precise, but safer than before)
              const deletedCarts = await db.abandonedCart.deleteMany({
                where: {
                  productId: paymentIntent.metadata.productId,
                  userId: paymentIntent.metadata.userId || null, // Match user ID if logged in, null if guest
                  recovered: false, // Only delete non-recovered carts
                },
              });

              if (deletedCarts.count > 0) {
                console.log(
                  `✅ Deleted ${deletedCarts.count} abandoned cart record(s) after successful payment (by userId+productId fallback)`
                );
              } else {
                console.log(
                  "ℹ️ No abandoned cart records found to delete (by userId+productId fallback)"
                );
              }
            }
          } catch (deleteError) {
            console.warn(
              "⚠️ Error deleting abandoned cart record:",
              deleteError
            );
          }

          return NextResponse.json({ success: true, orderId: order.id });
        }
        case "charge.succeeded": {
          // Just log this event
          const charge = event.data.object as Stripe.Charge;
          console.log(
            `💰 Charge succeeded: ${charge.id}, PI: ${charge.payment_intent}`
          );
          return NextResponse.json({ received: true });
        }
        case "transfer.created": {
          const transfer = event.data.object as Stripe.Transfer;
          console.log(
            `💰 Transfer created: ${transfer.id} for amount: ${transfer.amount}`
          );

          // Since we're creating transfers manually, the order should already have the transfer ID
          // This event is just for logging purposes now
          if (transfer.metadata?.orderId) {
            console.log(
              `✅ Transfer ${transfer.id} for order ${transfer.metadata.orderId}`
            );
            console.log(`💰 Transfer amount: ${transfer.amount} cents`);
            console.log(
              `💰 Platform fee: ${transfer.metadata.platformFee} cents`
            );
            console.log(`💰 Stripe fee: ${transfer.metadata.stripeFee} cents`);
            console.log(
              `💰 Total amount: ${transfer.metadata.totalAmount} cents`
            );
          }

          return NextResponse.json({ received: true });
        }
        case "transfer.updated": {
          const transfer = event.data.object as Stripe.Transfer;
          console.log(`💰 Transfer updated: ${transfer.id}`);

          // Update order status from HELD to PENDING when transfer is completed
          if (transfer.metadata?.orderId && transfer.object === "transfer") {
            try {
              const order = await db.order.findUnique({
                where: { id: transfer.metadata.orderId },
                select: { id: true, status: true, isDigital: true },
              });

              if (order && order.status === ("HELD" as any)) {
                await db.order.update({
                  where: { id: order.id },
                  data: {
                    status: OrderStatus.PENDING,
                    completedAt: new Date(),
                  },
                });
                console.log(
                  `✅ Updated order ${order.id} from HELD to PENDING after transfer completed`
                );
              }
            } catch (error) {
              console.error(
                "❌ Error updating order status after transfer updated:",
                error
              );
            }
          }

          return NextResponse.json({ received: true });
        }
        case "application_fee.created": {
          // We're not using application fees anymore, so just log this event
          const applicationFee = event.data.object as Stripe.ApplicationFee;
          console.log(
            `💰 Application fee created: ${applicationFee.id} for amount: ${applicationFee.amount} (not used in manual transfer mode)`
          );
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
                  stripeSessionId: {
                    contains: charge.payment_intent as string,
                  },
                },
                select: { id: true, isDigital: true },
              });

              if (order && order.isDigital) {
                // Update order status to REFUNDED
                await db.order.update({
                  where: { id: order.id },
                  data: {
                    status: "REFUNDED",
                    paymentStatus: "REFUNDED",
                  },
                });

                console.log(
                  `✅ Order ${order.id} marked as refunded. Download access revoked.`
                );

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
          return NextResponse.json({
            success: true,
            message: "Event type not handled",
          });
        }
      }
    } catch (error: any) {
      console.error("❌ Error processing webhook:", error);

      // Log to error database
      logError({
        code: "WEBHOOK_PROCESSING_FAILED",
        route: "/api/stripe/webhooks",
        method: "POST",
        error,
        metadata: {
          eventType: event?.type,
          eventId: event?.id,
        },
      });

      return NextResponse.json(
        { error: "Webhook processing failed", message: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("❌ Error in webhook handler:", error);

    // Log to error database
    await logError({
      code: "WEBHOOK_HANDLER_FAILED",
      route: "/api/stripe/webhooks",
      method: "POST",
      error,
      metadata: {
        note: "Error occurred before webhook event could be parsed",
      },
    });

    return NextResponse.json(
      { error: "Webhook handler failed", message: error.message },
      { status: 500 }
    );
  }
}

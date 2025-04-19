"use server";

import { db } from "@/lib/db";
import { PLATFORM_FEE_PERCENT } from "@/lib/feeConfig";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";

//TODO delete this page as it is now handled in an api route verify that all information in the api is accurate

export async function BuyProduct(formData: FormData) {
  const id = formData.get("id") as string;

  // Fetch the product from the database
  const data = await db.product.findUnique({
    where: {
      id: id,
    },
    select: {
      name: true,
      description: true,
      price: true,
      images: true,
      productFile: true,
      seller: {
        select: {
          connectedAccountId: true, // Fetch the seller's Stripe account ID
        },
      },
    },
  });

  // If no product is found, return an error or handle appropriately
  if (!data) {
    throw new Error("Product not found");
  }

  if (!data.seller?.connectedAccountId) {
    throw new Error("Seller's Stripe account not connected");
  }

  // If the product is digital, ensure the product file is provided in metadata
  const metadata = {
    link: data.productFile || "", // Only set link if productFile exists
  };

  // Create a payment intent with Stripe
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(data.price * 100), // Convert price to cents
    currency: "usd",
    payment_method_types: ["card"],
    metadata: metadata,
    application_fee_amount: Math.round(PLATFORM_FEE_PERCENT), // 10% fee
    transfer_data: {
      destination: data.seller.connectedAccountId, // Now we know this exists
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return { clientSecret: paymentIntent.client_secret };
}

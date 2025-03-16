"use server";

import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";

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

  // If the product is digital, ensure the product file is provided in metadata
  const metadata = {
    link: data.productFile || "", // Only set link if productFile exists
  };

  // Create a checkout session with Stripe
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: Math.round(data.price * 100), // Convert price to cents
          product_data: {
            name: data.name,
            description: data.description,
            images: data.images,
          },
        },
        quantity: 1, // For now, assuming quantity is 1
      },
    ],
    metadata: metadata,
    payment_intent_data: {
      application_fee_amount: Math.round(data.price * 100 * 0.1), // 10% fee
      transfer_data: {
        destination: data.seller?.connectedAccountId, // Transfer to seller's account
      },
    },
    success_url:
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000/payment/success"
        : "https://www.yarnnu.com/payment/success",
    cancel_url:
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000/payment/cancel"
        : "https://www.yarnnu.com/payment/cancel",
  });

  // Redirect to Stripe Checkout session
  return redirect(session.url as string);
}

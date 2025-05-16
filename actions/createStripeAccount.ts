"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripeSecret } from "@/lib/stripe";
import { redirect } from "next/navigation";

export async function CreateStripeAccountLink() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("User is not authenticated.");
  }

  // Fetch seller data
  const seller = await db.user.findUnique({
    where: { id: userId },
    select: {
      seller: {
        select: {
          connectedAccountId: true,
        },
      },
    },
  });

  let connectedAccountId = seller?.seller?.connectedAccountId;

  // If the seller has no connected Stripe account, create one
  if (!connectedAccountId) {
    const account = await stripeSecret.instance.accounts.create({
      type: "express",
      country: "US", // Change based on your supported countries
      email: session.user.email,
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
    });

    // Store the new account ID in the database
    await db.seller.update({
      where: { userId },
      data: { connectedAccountId: account.id },
    });

    connectedAccountId = account.id;
  }

  // Create the account link
  const accountLink = await stripeSecret.instance.accountLinks.create({
    account: connectedAccountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/seller/dashboard/billing`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/stripe-return/${connectedAccountId}`,
    type: "account_onboarding",
  });

  return redirect(accountLink.url);
}

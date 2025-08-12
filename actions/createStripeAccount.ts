"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripeSecret } from "@/lib/stripe";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { Permission } from "@/data/roles-and-permissions";
import { getUserLocationPreferences } from "@/lib/ipinfo";
import { headers } from "next/headers";

// Helper function to get country code with three-tier fallback
async function getCountryCodeForStripe(userId: string): Promise<string> {
  try {
    // Tier 1: Get country from seller preferences (if they've already set it)
    const seller = await db.seller.findUnique({
      where: { userId },
      select: { shopCountry: true }
    });

    if (seller?.shopCountry && seller.shopCountry !== "US") {
      console.log(`Using seller's shop country preference: ${seller.shopCountry}`);
      return seller.shopCountry;
    }

    // Tier 2: Use location detector to get current country
    try {
      const headersList = await headers();
      const forwarded = headersList.get('x-forwarded-for');
      const realIP = headersList.get('x-real-ip');
      const clientIP = forwarded?.split(',')[0] || realIP || '';

      if (clientIP) {
        const locationPreferences = await getUserLocationPreferences(clientIP);
        if (locationPreferences.countryCode && locationPreferences.countryCode !== "US") {
          console.log(`Using detected location: ${locationPreferences.countryCode}`);
          return locationPreferences.countryCode;
        }
      }
    } catch (locationError) {
      console.warn("Location detection failed, falling back to US:", locationError);
    }

    // Tier 3: Default to US
    console.log("Using default country: US");
    return "US";
  } catch (error) {
    console.error("Error determining country code:", error);
    return "US"; // Safe fallback
  }
}

export async function CreateStripeAccountLink() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("User is not authenticated.");
  }

  const canManageSettings = await hasPermission(userId, "MANAGE_SELLER_SETTINGS" as Permission);
  if (!canManageSettings) {
    throw new Error("You don't have permission to perform this action.");
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

  // If the seller has no connected Stripe account or has a temporary one, create a real one
  if (!connectedAccountId || connectedAccountId.startsWith('temp_')) {
    if (!session.user.email) {
      throw new Error("User email is not available.");
    }

    // Get country code using three-tier fallback
    const countryCode = await getCountryCodeForStripe(userId);

    console.log("Creating new Stripe Connect account for user:", userId, "in country:", countryCode);
    
    const account = await stripeSecret.instance.accounts.create({
      type: "express",
      country: countryCode,
      email: session.user.email,
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
    });

    // Store the new account ID in the database
    await db.seller.update({
      where: { userId },
      data: { 
        connectedAccountId: account.id,
        stripeConnected: false // Will be set to true after onboarding completion via webhook
      },
    });

    connectedAccountId = account.id;
    console.log("Created Stripe account:", account.id, "for country:", countryCode);
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

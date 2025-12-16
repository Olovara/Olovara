"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripeSecret } from "@/lib/stripe";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { Permission } from "@/data/roles-and-permissions";
import { getUserLocationPreferences } from "@/lib/ipinfo";
import { headers } from "next/headers";
import { logError } from "@/lib/error-logger";

// Helper function to get country code with three-tier fallback
async function getCountryCodeForStripe(userId: string): Promise<string> {
  try {
    // Tier 1: Get country from seller preferences (if they've already set it)
    const seller = await db.seller.findUnique({
      where: { userId },
      select: { shopCountry: true },
    });

    if (seller?.shopCountry && seller.shopCountry !== "US") {
      console.log(
        `Using seller's shop country preference: ${seller.shopCountry}`
      );
      return seller.shopCountry;
    }

    // Tier 2: Use location detector to get current country
    try {
      const headersList = await headers();
      const forwarded = headersList.get("x-forwarded-for");
      const realIP = headersList.get("x-real-ip");
      const clientIP = forwarded?.split(",")[0] || realIP || "";

      if (clientIP) {
        const locationPreferences = await getUserLocationPreferences(clientIP);
        if (
          locationPreferences.countryCode &&
          locationPreferences.countryCode !== "US"
        ) {
          console.log(
            `Using detected location: ${locationPreferences.countryCode}`
          );
          return locationPreferences.countryCode;
        }
      }
    } catch (locationError) {
      console.warn(
        "Location detection failed, falling back to US:",
        locationError
      );
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

  const canManageSettings = await hasPermission(
    userId,
    "MANAGE_SELLER_SETTINGS" as Permission
  );
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

  // If the seller has a connected account, check if it's fully onboarded
  if (connectedAccountId && !connectedAccountId.startsWith("temp_")) {
    try {
      // Check if the account is already fully onboarded
      const account =
        await stripeSecret.instance.accounts.retrieve(connectedAccountId);

      if (account.charges_enabled && account.payouts_enabled) {
        // Account is fully onboarded - update database and redirect to dashboard
        await db.seller.update({
          where: { userId },
          data: { stripeConnected: true },
        });

        // Redirect to Stripe dashboard instead of onboarding
        const loginLink =
          await stripeSecret.instance.accounts.createLoginLink(
            connectedAccountId
          );
        return redirect(loginLink.url);
      }
      // Account exists but not fully onboarded - continue to create account link
    } catch (stripeError: any) {
      // If account doesn't exist or there's an error, create a new one
      console.warn(
        "Error checking existing Stripe account:",
        stripeError.message
      );
      connectedAccountId = null; // Reset to create new account
    }
  }

  // If the seller has no connected Stripe account or has a temporary one, create a real one
  if (!connectedAccountId || connectedAccountId.startsWith("temp_")) {
    if (!session.user.email) {
      throw new Error("User email is not available.");
    }

    // Get country code using three-tier fallback
    const countryCode = await getCountryCodeForStripe(userId);

    console.log(
      "Creating new Stripe Connect account for user:",
      userId,
      "in country:",
      countryCode
    );

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
        stripeConnected: false, // Will be set to true after onboarding completion via webhook
      },
    });

    connectedAccountId = account.id;
    console.log(
      "Created Stripe account:",
      account.id,
      "for country:",
      countryCode
    );
  }

  try {
    // Create the account link
    const accountLink = await stripeSecret.instance.accountLinks.create({
      account: connectedAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/seller/dashboard/billing`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/stripe-return/${connectedAccountId}`,
      type: "account_onboarding",
    });

    // redirect() throws NEXT_REDIRECT error internally - this is expected behavior
    // Next.js handles this automatically, but we need to let it propagate
    redirect(accountLink.url);
    // This line should never be reached, but TypeScript needs it
    return;
  } catch (error: any) {
    // Check if this is a Next.js redirect error - these are expected and should not be logged
    if (
      error?.digest?.startsWith("NEXT_REDIRECT") ||
      error?.message === "NEXT_REDIRECT" ||
      error?.digest === "515638683" ||
      (typeof error?.digest === "string" && error.digest.includes("515638683"))
    ) {
      // Re-throw redirect errors - they're expected and handled by Next.js
      // Do NOT log these - they're not errors
      throw error;
    }

    // Only log actual errors (not redirects)
    const userMessage = logError({
      code: "STRIPE_ACCOUNT_LINK_FAILED",
      userId,
      route: "/actions/createStripeAccount",
      method: "GET",
      error,
      metadata: {
        connectedAccountId,
        hasExistingAccount: !!seller?.seller?.connectedAccountId,
      },
    });
    throw new Error(userMessage);
  }
}

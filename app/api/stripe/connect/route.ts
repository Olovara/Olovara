import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getUserLocationPreferences } from "@/lib/ipinfo";

// Helper function to get country code with three-tier fallback
async function getCountryCodeForStripe(userId: string, request: NextRequest): Promise<string> {
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
      const forwarded = request.headers.get('x-forwarded-for');
      const realIP = request.headers.get('x-real-ip');
      const clientIP = forwarded?.split(',')[0] || realIP || request.ip || '';

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

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get the seller profile
    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: { id: true, userId: true, connectedAccountId: true }
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
    }

    // Check if already connected with a real Stripe account
    if (seller.connectedAccountId && !seller.connectedAccountId.startsWith('temp_')) {
      return NextResponse.json({ 
        error: "Stripe account already connected",
        connectedAccountId: seller.connectedAccountId 
      }, { status: 400 });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    let connectedAccountId = seller.connectedAccountId;

    // If the seller has a temporary connectedAccountId, create a real Stripe account
    if (!connectedAccountId || connectedAccountId.startsWith('temp_')) {
      if (!session.user.email) {
        return NextResponse.json({ error: "User email is not available" }, { status: 400 });
      }

      // Get country code using three-tier fallback
      const countryCode = await getCountryCodeForStripe(session.user.id, request);

      console.log("Creating new Stripe Connect account for user:", session.user.id, "in country:", countryCode);
      
      // Create a new Stripe Connect account
      const account = await stripe.accounts.create({
        type: "express",
        country: countryCode,
        email: session.user.email,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
      });

      // Update the database with the real Stripe account ID
      await db.seller.update({
        where: { userId: session.user.id },
        data: { 
          connectedAccountId: account.id,
          stripeConnected: false // Will be set to true after onboarding completion via webhook
        }
      });

      connectedAccountId = account.id;
      console.log("Created Stripe account:", account.id, "for country:", countryCode);
    }

    // Create the account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: connectedAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/seller/dashboard/billing`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/stripe-return/${connectedAccountId}`,
      type: 'account_onboarding',
    });

    console.log("Stripe account link created for user:", session.user.id);

    return NextResponse.json({
      success: true,
      url: accountLink.url,
      connectedAccountId: connectedAccountId
    });

  } catch (error) {
    console.error("Error creating Stripe Connect account link:", error);
    return NextResponse.json(
      { error: "Failed to create Stripe Connect account link" },
      { status: 500 }
    );
  }
}
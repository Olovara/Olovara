import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

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

    // Check if already connected
    if (seller.connectedAccountId && !seller.connectedAccountId.startsWith('temp_')) {
      return NextResponse.json({ 
        error: "Stripe account already connected",
        connectedAccountId: seller.connectedAccountId 
      }, { status: 400 });
    }

    // Create Stripe Connect account link
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const accountLink = await stripe.accountLinks.create({
      account: seller.connectedAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/seller/dashboard`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/stripe-return/${seller.connectedAccountId}`,
      type: 'account_onboarding',
    });

    // Update seller to mark as connected
    await db.seller.update({
      where: { userId: session.user.id },
      data: { stripeConnected: true }
    });

    // Note: Session refresh is now handled by the client-side page reload
    // The user's onboarding status has been updated in the database
    console.log("Stripe account connected successfully for user:", session.user.id);

    return NextResponse.json({
      success: true,
      url: accountLink.url
    });

  } catch (error) {
    console.error("Error creating Stripe Connect account link:", error);
    return NextResponse.json(
      { error: "Failed to create Stripe Connect account link" },
      { status: 500 }
    );
  }
}
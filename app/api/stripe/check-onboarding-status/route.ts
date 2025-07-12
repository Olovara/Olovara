import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { connectedAccountId } = await request.json();

    if (!connectedAccountId) {
      return NextResponse.json({ error: "Connected account ID is required" }, { status: 400 });
    }

    // Verify the seller owns this connected account
    const seller = await db.seller.findUnique({
      where: { 
        userId: session.user.id,
        connectedAccountId: connectedAccountId
      },
      select: { id: true, stripeConnected: true }
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller not found or account mismatch" }, { status: 404 });
    }

    // If already connected, no need to check
    if (seller.stripeConnected) {
      return NextResponse.json({ success: true, alreadyConnected: true });
    }

    // Check the Stripe account status
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    try {
      const account = await stripe.accounts.retrieve(connectedAccountId);
      
      // Check if the account is fully onboarded (can accept charges and payouts)
      if (account.charges_enabled && account.payouts_enabled) {
        // Update the seller's stripeConnected status
        await db.seller.update({
          where: { id: seller.id },
          data: { stripeConnected: true }
        });

        console.log(`✅ Stripe account ${connectedAccountId} fully onboarded for seller ${seller.id}`);
        
        return NextResponse.json({ 
          success: true, 
          connected: true,
          message: "Stripe account fully onboarded"
        });
      } else {
        console.log(`⏳ Stripe account ${connectedAccountId} not fully onboarded yet`);
        
        return NextResponse.json({ 
          success: true, 
          connected: false,
          message: "Stripe account not fully onboarded yet"
        });
      }
    } catch (stripeError: any) {
      console.error("Error checking Stripe account status:", stripeError);
      return NextResponse.json({ 
        error: "Failed to check Stripe account status",
        message: stripeError.message 
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Error in check onboarding status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
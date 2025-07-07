import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    // Find and deactivate the subscription
    const subscription = await db.newsletterSubscription.findUnique({
      where: { email },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    if (!subscription.isActive) {
      return NextResponse.json(
        { message: "You are already unsubscribed" },
        { status: 200 }
      );
    }

    // Deactivate the subscription
    await db.newsletterSubscription.update({
      where: { email },
      data: { 
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      { message: "Successfully unsubscribed from newsletter" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
} 
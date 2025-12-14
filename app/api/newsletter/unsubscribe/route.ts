import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";

export async function GET(req: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let email: string | null = null;

  try {
    const { searchParams } = new URL(req.url);
    email = searchParams.get("email");

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
    // Log to console (always happens)
    console.error("Newsletter unsubscribe error:", error);

    // Don't log validation errors - they're expected client-side issues

    // Log to database - user could email about "couldn't unsubscribe"
    const userMessage = logError({
      code: "NEWSLETTER_UNSUBSCRIBE_FAILED",
      userId: undefined, // Public route
      route: "/api/newsletter/unsubscribe",
      method: "GET",
      error,
      metadata: {
        email,
        note: "Failed to unsubscribe from newsletter",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

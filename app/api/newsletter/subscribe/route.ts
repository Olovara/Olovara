import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { NewsletterSubscriptionWithTrackingSchema } from "@/schemas/NewsletterSubscriptionSchema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Get client IP and user agent for tracking
    const ipAddress =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Validate the request body
    const validatedData = NewsletterSubscriptionWithTrackingSchema.parse({
      ...body,
      ipAddress,
      userAgent,
    });

    // Check if email already exists
    const existingSubscription = await db.newsletterSubscription.findUnique({
      where: { email: validatedData.email },
    });

    if (existingSubscription) {
      // If subscription exists but is inactive, reactivate it
      if (!existingSubscription.isActive) {
        await db.newsletterSubscription.update({
          where: { email: validatedData.email },
          data: {
            isActive: true,
            updatedAt: new Date(),
          },
        });

        return NextResponse.json(
          { message: "Newsletter subscription reactivated successfully!" },
          { status: 200 }
        );
      }

      // If already active, return success
      return NextResponse.json(
        { message: "You're already subscribed to our newsletter!" },
        { status: 200 }
      );
    }

    // Create new subscription
    const subscription = await db.newsletterSubscription.create({
      data: {
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        source: validatedData.source || "website",
        ipAddress: validatedData.ipAddress,
        userAgent: validatedData.userAgent,
        location: validatedData.location,
      },
    });

    return NextResponse.json(
      {
        message: "Successfully subscribed to newsletter!",
        subscription: {
          id: subscription.id,
          email: subscription.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Newsletter subscription error:", error);

    if (error instanceof Error && error.message.includes("Invalid email")) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to subscribe to newsletter. Please try again." },
      { status: 500 }
    );
  }
}

// GET endpoint to check subscription status
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

    const subscription = await db.newsletterSubscription.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      subscribed: !!subscription && subscription.isActive,
      subscription,
    });
  } catch (error) {
    console.error("Newsletter subscription check error:", error);
    return NextResponse.json(
      { error: "Failed to check subscription status" },
      { status: 500 }
    );
  }
}

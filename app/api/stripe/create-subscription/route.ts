import { db } from "@/lib/db";
import { stripeSecret } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the seller profile
    const seller = await db.seller.findUnique({
      where: { userId: user.id },
      select: { id: true, userId: true },
    });

    if (!seller) {
      return NextResponse.json(
        { error: "Seller profile not found" },
        { status: 404 }
      );
    }

    const { customerId, priceId } = await req.json();

    if (!customerId || !priceId) {
      return NextResponse.json(
        { error: "Customer Id or price id is missing" },
        { status: 400 }
      );
    }

    // Check if seller already has a subscription
    const existingSubscription = await db.sellerSubscription.findUnique({
      where: { sellerId: seller.id },
      include: { plan: true },
    });

    try {
      if (
        existingSubscription?.stripeSubscriptionId &&
        existingSubscription.status === "ACTIVE"
      ) {
        // Update the subscription instead of creating one
        console.log("Updating the subscription");
        const currentSubscriptionDetails =
          await stripeSecret.instance.subscriptions.retrieve(
            existingSubscription.stripeSubscriptionId
          );

        const subscription = await stripeSecret.instance.subscriptions.update(
          existingSubscription.stripeSubscriptionId,
          {
            items: [
              {
                id: currentSubscriptionDetails.items.data[0].id,
                deleted: true,
              },
              { price: priceId },
            ],
            expand: ["latest_invoice.payment_intent"],
          }
        );

        // Update the subscription in the database
        await db.sellerSubscription.update({
          where: { sellerId: seller.id },
          data: {
            currentPeriodStart: new Date(
              subscription.current_period_start * 1000
            ),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            status: subscription.status === "active" ? "ACTIVE" : "CANCELLED",
          },
        });

        return NextResponse.json({
          subscriptionId: subscription.id,
          clientSecret:
            typeof subscription.latest_invoice === 'object' && 
            typeof subscription.latest_invoice?.payment_intent === 'object' && 
            subscription.latest_invoice.payment_intent?.client_secret,
        });
      } else {
        // Create a new subscription
        console.log("Creating a new subscription");
        const subscription = await stripeSecret.instance.subscriptions.create({
          customer: customerId,
          items: [
            {
              price: priceId,
            },
          ],
          payment_behavior: "default_incomplete",
          payment_settings: { save_default_payment_method: "on_subscription" },
          expand: ["latest_invoice.payment_intent"],
        });

        // Get the plan details
        const plan = await db.subscriptionPlan.findFirst({
          where: { stripePriceId: priceId },
        });

        if (!plan) {
          throw new Error("Plan not found");
        }

        // Create or update the subscription in the database
        await db.sellerSubscription.upsert({
          where: { sellerId: seller.id },
          create: {
            sellerId: seller.id,
            planId: plan.id,
            stripeSubscriptionId: subscription.id,
            currentPeriodStart: new Date(
              subscription.current_period_start * 1000
            ),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            status: subscription.status === "active" ? "ACTIVE" : "TRIALING",
            trialEndsAt: subscription.trial_end
              ? new Date(subscription.trial_end * 1000)
              : null,
          },
          update: {
            planId: plan.id,
            stripeSubscriptionId: subscription.id,
            currentPeriodStart: new Date(
              subscription.current_period_start * 1000
            ),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            status: subscription.status === "active" ? "ACTIVE" : "TRIALING",
            trialEndsAt: subscription.trial_end
              ? new Date(subscription.trial_end * 1000)
              : null,
          },
        });

        return NextResponse.json({
          subscriptionId: subscription.id,
          clientSecret:
            typeof subscription.latest_invoice === 'object' && 
            typeof subscription.latest_invoice?.payment_intent === 'object' && 
            subscription.latest_invoice.payment_intent?.client_secret,
        });
      }
    } catch (error) {
      console.log("🔴 Stripe Error:", error);
      return NextResponse.json(
        { error: "Stripe error occurred" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.log("🔴 Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

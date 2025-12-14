import { stripeSecret } from "@/lib/stripe";
import { StripeCustomerType } from "@/types/stripe";
import { NextResponse } from "next/server";
import { logError } from "@/lib/error-logger";

export async function POST(req: Request) {
  // Declare variables outside try block so they're accessible in catch
  let body: any = null;

  try {
    body = await req.json();
    const { address, email, name, shipping }: StripeCustomerType = body;

    if (!email || !address || !name || !shipping) {
      return new NextResponse("Missing data", {
        status: 400,
      });
    }
    const customer = await stripeSecret.instance.customers.create({
      email,
      name,
      address,
      shipping,
    });
    return Response.json({ customerId: customer.id });
  } catch (error) {
    // Log to console (always happens)
    console.log("🔴 Error", error);

    // Log to database - user could email about "couldn't create customer"
    const userMessage = logError({
      code: "STRIPE_CUSTOMER_CREATE_FAILED",
      userId: null, // Customer creation might not have user context
      route: "/api/stripe/create-customer",
      method: "POST",
      error,
      metadata: {
        email: body?.email,
        note: "Failed to create Stripe customer",
      },
    });

    return new NextResponse(userMessage, { status: 500 });
  }
}

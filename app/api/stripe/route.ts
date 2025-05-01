import ProductEmail from "@/components/emails/ProductEmail";
import { stripe } from "@/lib/stripe";

import { headers } from "next/headers";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const body = await req.text();

  const signature = headers().get("Stripe-Signature") as string;

  let event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_SECRET_WEBHOOK;
    
    if (!webhookSecret) {
      console.error("❌ No webhook secret found in environment variables");
      return new Response("Server configuration error", { status: 500 });
    }
    
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (error: unknown) {
    return new Response("webhook error", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;

      const link = session.metadata?.link;
      const customerEmail = session.customer_email;

      if (!customerEmail) {
        console.error("No customer email found in session");
        return new Response("No customer email found", { status: 400 });
      }

      const { data, error } = await resend.emails.send({
        from: "Yarnnu <noreply@yarnnu.com>",
        to: [customerEmail],
        subject: "Your Product from Yarnnu",
        react: ProductEmail({
          link: link as string,
          isDigital: true,
        }),
      });

      break;
    }
    default: {
      console.log("unhandled event");
    }
  }

  return new Response(null, { status: 200 });
}
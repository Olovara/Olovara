import { db } from "@/lib/db";
import { stripeConnect } from "@/lib/stripe";
import { headers } from "next/headers";
import { updateUserSession } from "@/lib/session-update";

export async function POST(req: Request) {
  const body = await req.text();

  const signature = headers().get("Stripe-Signature") as string;

  let event;

  try {
    event = stripeConnect.instance.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_CONNECT_WEBHOOK_SECRET as string
    );
  } catch (error: unknown) {
    return new Response("webhook error", { status: 400 });
  }

  switch (event.type) {
    case "account.updated": {
      const account = event.data.object;

      // Find the seller with this connectedAccountId
      const seller = await db.seller.findUnique({
        where: {
          connectedAccountId: account.id,
        },
      });

      if (seller) {
        // Update the stripeConnected field on the Seller model
        await db.seller.update({
          where: {
            id: seller.id,
          },
          data: {
            stripeConnected:
              account.capabilities?.transfers === "active" &&
              account.capabilities?.card_payments === "active",
          },
        });

        // Update user session to reflect Stripe connection status
        await updateUserSession(seller.userId);
      }
      break;
    }
    default: {
      console.log("unhandled event");
    }
  }

  return new Response(null, { status: 200 });
}
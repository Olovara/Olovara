"use server";

import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";

export async function BuyProduct(formData: FormData) {
    const id = formData.get("id") as string;
    const data = await db.product.findUnique({
      where: {
        id: id,
      },
      select: {
        name: true,
        description: true,
        price: true,
        images: true,
        productFile: true,
        //TODO re add the seller information here
      },
    });
  
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round((data?.price as number) * 100),
            product_data: {
              name: data?.name as string,
              description: data?.description,
              images: data?.images,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        link: data?.productFile as string,
      },
  
      payment_intent_data: {
        application_fee_amount: Math.round((data?.price as number) * 100) * 0.1,
        transfer_data: {
          destination: data?.User?.connectedAccountId as string,
        },
      },
      success_url:
        process.env.NODE_ENV === "development"
          ? "http://localhost:3000/payment/success"
          : "https://www.yarnnu.com/payment/success",
      cancel_url:
        process.env.NODE_ENV === "development"
          ? "http://localhost:3000/payment/cancel"
          : "https://www.yarnnu.com/payment/cancel",
    });
  
    return redirect(session.url as string);
  }
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";

export async function GetStripeDashboardLink() {
  const session = await auth(); // Get session
  const userId = session?.user?.id; // Extract userId from session

  if (!userId) {
    throw new Error();
  }

  const data = await db.user.findUnique({
    where: { id: userId },
    select: {
      seller: {
        select: {
          connectedAccountId: true,
        },
      },
    },
  });

  const loginLink = await stripe.accounts.createLoginLink(
    data?.seller?.connectedAccountId as string
  );

  return redirect(loginLink.url);
}

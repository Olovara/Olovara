import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export async function CreateStripeAccountLink() {
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
          connectedAccoundId: true,
        },
      },
    },
  });

  const accountLink = await stripe.accountLinks.create({
    account: data?.connectedAccountId as string,
    refresh_url:
      process.env.NODE_ENV === "development"
        ? `http://localhost:3000/billing`
        : `https://marshal-ui-yt.vercel.app/billing`,
    return_url:
      process.env.NODE_ENV === "development"
        ? `http://localhost:3000/return/${data?.connectedAccountId}`
        : `https://marshal-ui-yt.vercel.app/return/${data?.connectedAccountId}`,
    type: "account_onboarding",
  });

  return redirect(accountLink.url);
}

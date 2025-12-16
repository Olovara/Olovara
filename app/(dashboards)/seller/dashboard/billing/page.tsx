import { CreateStripeAccountLink } from "@/actions/createStripeAccount";
import { GetStripeDashboardLink } from "@/actions/getStripeDashboard";
import { auth } from "@/auth";
import { Submitbutton } from "@/components/SubmitButtons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";

export const metadata = {
  title: "Seller - Billing",
};

async function getBillingData(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      seller: {
        select: {
          stripeConnected: true,
          connectedAccountId: true,
        },
      },
    },
  });

  // If seller has a connected account but stripeConnected is false, verify with Stripe
  if (
    user?.seller?.connectedAccountId &&
    !user.seller.stripeConnected &&
    !user.seller.connectedAccountId.startsWith("temp_")
  ) {
    try {
      const { stripeSecret } = await import("@/lib/stripe");
      const account = await stripeSecret.instance.accounts.retrieve(
        user.seller.connectedAccountId
      );

      // If account is fully onboarded, update the database
      if (account.charges_enabled && account.payouts_enabled) {
        await db.seller.update({
          where: { userId },
          data: { stripeConnected: true },
        });
        // Return updated data
        return {
          seller: {
            stripeConnected: true,
            connectedAccountId: user.seller.connectedAccountId,
          },
        };
      }
    } catch (error) {
      // If we can't verify, just use the database value
      console.warn("Failed to verify Stripe account status:", error);
    }
  }

  return user;
}

export default async function BillingPage() {
  noStore();
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Not authenticated");
  }

  const data = await getBillingData(userId);

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Billing</h2>
      </div>
      <div className="flex-1 pt-2">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Payment Settings</CardTitle>
            <CardDescription>
              Manage your Stripe account and payment details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.seller?.stripeConnected === false && (
                <div className="space-y-2">
                  {data?.seller?.connectedAccountId &&
                  !data.seller.connectedAccountId.startsWith("temp_") ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Your Stripe account setup is in progress. Complete the
                        onboarding process to start receiving payments.
                      </p>
                      <form action={CreateStripeAccountLink}>
                        <Submitbutton
                          title="Complete Stripe Setup"
                          isPending={false}
                        />
                      </form>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Connect your Stripe account to start receiving payments
                        for your products.
                      </p>
                      <form action={CreateStripeAccountLink}>
                        <Submitbutton
                          title="Link your Account to Stripe"
                          isPending={false}
                        />
                      </form>
                    </>
                  )}
                </div>
              )}

              {data?.seller?.stripeConnected === true && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Your Stripe account is connected. You can view your
                    dashboard to manage payments and transfers.
                  </p>
                  <form action={GetStripeDashboardLink}>
                    <Submitbutton
                      title="View Stripe Dashboard"
                      isPending={false}
                    />
                  </form>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

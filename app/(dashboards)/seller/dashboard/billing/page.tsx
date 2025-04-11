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
  return await db.user.findUnique({
    where: { id: userId },
    select: {
      seller: {
        select: {
          stripeConnected: true,
        },
      },
    },
  });
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
                  <p className="text-sm text-muted-foreground">
                    Connect your Stripe account to start receiving payments for your products.
                  </p>
                  <form action={CreateStripeAccountLink}>
                    <Submitbutton title="Link your Account to Stripe" isPending={false} />
                  </form>
                </div>
              )}

              {data?.seller?.stripeConnected === true && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Your Stripe account is connected. You can view your dashboard to manage payments and transfers.
                  </p>
                  <form action={GetStripeDashboardLink}>
                    <Submitbutton title="View Stripe Dashboard" isPending={false} />
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
import { CreateStripeAccountLink } from "@/actions/createStripeAccount";
import { GetStripeDashboardLink } from "@/actions/getStripeDashboard";
import { auth } from "@/auth";
import MemberForm from "@/components/forms/MemberForm";
import SellerForm from "@/components/forms/SellerForm";
import { Submitbutton } from "@/components/SubmitButtons";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";

export const metadata = {
  title: "Seller - Settings",
};

async function getBillingData(userId: string) {
  return await db.user.findUnique({
    where: { id: userId },
    select: {
      seller: {
        select: {
          stripeConnected: true, // Correct field name from Seller model
        },
      },
    },
  });
}

export default async function SellerSettings() {
  noStore(); // Ensures fresh data on every request
  const session = await auth(); // Get session
  const userId = session?.user?.id; // Extract userId from session

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const data = await getBillingData(userId);

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      {/* Tabs */}
      <Tabs defaultValue="personal">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="shop">Shop</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>
        </div>

        {/* Content Area */}
        <div className="flex-1 pt-2">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Personal Settings */}
              <TabsContent value="personal">
                <MemberForm />
              </TabsContent>

              {/* Shop Settings */}
              <TabsContent value="shop">
                <SellerForm />
              </TabsContent>

              {/* Billing Section */}
              <TabsContent value="billing">
                <h1>Billing</h1>
                <p>Manage your payment details</p>
                {data?.seller?.stripeConnected === false && (
                  <form action={CreateStripeAccountLink}>
                    <Submitbutton title="Link your Account to Stripe" />
                  </form>
                )}

                {data?.seller?.stripeConnected === true && (
                  <form action={GetStripeDashboardLink}>
                    <Submitbutton title="View Stripe Dashboard" />
                  </form>
                )}
              </TabsContent>
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </main>
  );
}

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import PermissionGate from "@/components/auth/permission-gate";
import ShippingOptionFormWrapper from "./(components)/ShippingOptionFormWrapper";
import CountryExclusionsMessage from "@/components/shipping/CountryExclusionsMessage";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const metadata = {
  title: "Seller - Create Shipping Option",
};

export default async function CreateShippingOptionPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get seller's excluded countries
  const seller = await db.seller.findUnique({
    where: { userId: session.user.id },
    select: {
      excludedCountries: true,
    },
  });

  return (
    <PermissionGate requiredPermission="MANAGE_SELLER_SETTINGS">
      <div className="flex flex-col gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/seller/dashboard">
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/seller/dashboard/shipping">
                Shipping
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/seller/dashboard/shipping/create">
                Create
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
          <div>
            <h3 className="text-lg font-medium">Create Shipping Option</h3>
            <p className="text-sm text-muted-foreground">
              Set up shipping rates for your products. This will help customers
              know how much shipping will cost.
            </p>
          </div>
          <CountryExclusionsMessage
            excludedCountries={seller?.excludedCountries || []}
          />
          <ShippingOptionFormWrapper />
        </div>
      </div>
    </PermissionGate>
  );
}

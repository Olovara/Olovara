import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import PermissionGate from "@/components/auth/permission-gate";
import ShippingOptionsTable from "@/app/(dashboards)/seller/dashboard/shipping/_components/ShippingOptionsTable";
import CountryExclusionsMessage from "@/components/shipping/CountryExclusionsMessage";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export const metadata = {
  title: "Seller - Shipping Options",
};

export default async function ShippingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get seller data to access shipping options and exclusions
  const seller = await db.seller.findUnique({
    where: { userId: session.user.id },
    select: {
      excludedCountries: true,
      shippingOptions: {
        select: {
          id: true,
          name: true,
          isDefault: true,
          countryOfOrigin: true,
          defaultShipping: true,
          defaultShippingCurrency: true,
          sellerId: true,
          createdAt: true,
          updatedAt: true,
          rates: {
            select: {
              id: true,
              zone: true,
              price: true,
              additionalItem: true,
              isFreeShipping: true,
              type: true,
              countryCode: true,
            },
          },
        },
      },
    },
  });

  // Transform the data to match the expected interface (convert null to undefined)
  const transformedOptions = (seller?.shippingOptions || []).map((option) => ({
    ...option,
    rates: option.rates.map((rate) => ({
      ...rate,
      type: (rate.type || "zone") as "zone" | "country",
      zone: rate.zone ?? undefined,
      countryCode: rate.countryCode ?? undefined,
    })),
  }));

  return (
    <PermissionGate requiredPermission="MANAGE_SELLER_SETTINGS">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
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
            </BreadcrumbList>
          </Breadcrumb>
          <Link href="/seller/dashboard/shipping/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Shipping Option
            </Button>
          </Link>
        </div>

        <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
          <div>
            <h3 className="text-lg font-medium">Shipping Options</h3>
            <p className="text-sm text-muted-foreground">
              Manage your shipping rates and delivery options for your products.
            </p>
          </div>
          <CountryExclusionsMessage
            excludedCountries={seller?.excludedCountries || []}
          />
          <ShippingOptionsTable options={transformedOptions} />
        </div>
      </div>
    </PermissionGate>
  );
}

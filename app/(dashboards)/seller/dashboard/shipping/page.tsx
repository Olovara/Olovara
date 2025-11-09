import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import PermissionGate from "@/components/auth/permission-gate";
import ShippingOptionsTable from "@/app/(dashboards)/seller/dashboard/shipping/_components/ShippingOptionsTable";
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

  // Get seller data to access shipping options
  const seller = await db.seller.findUnique({
    where: { userId: session.user.id },
    select: {
      shippingOptions: {
        select: {
          id: true,
          name: true,
          isDefault: true,
          countryOfOrigin: true,
          sellerId: true,
          createdAt: true,
          updatedAt: true,
          rates: {
            select: {
              id: true,
              zone: true,
              isInternational: true,
              price: true,
              currency: true,
              estimatedDays: true,
              additionalItem: true,
              serviceLevel: true,
              isFreeShipping: true,
              countryRates: true,
            },
          },
        },
      },
    },
  });

  // Transform the data to match the expected interface
  // Prisma returns countryRates as JsonValue, so we need to cast it properly
  const transformedOptions = (seller?.shippingOptions || []).map((option) => ({
    ...option,
    rates: option.rates.map((rate) => ({
      ...rate,
      countryRates: Array.isArray(rate.countryRates)
        ? (rate.countryRates as Array<{
            countryCode: string;
            price: number;
            currency: string;
          }>)
        : [],
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
          <ShippingOptionsTable options={transformedOptions} />
        </div>
      </div>
    </PermissionGate>
  );
}

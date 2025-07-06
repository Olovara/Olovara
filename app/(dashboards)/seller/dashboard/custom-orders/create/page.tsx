import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import Link from "next/link";
import PermissionGate from "@/components/auth/permission-gate";
import { PERMISSIONS } from "@/data/roles-and-permissions";
import CustomOrderFormBuilder from "@/components/seller/CustomOrderFormBuilder";

export const metadata = {
  title: "Seller - Create Custom Order Form",
};

export default async function CreateCustomOrderFormPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  // Check if seller accepts custom orders
  const seller = await db.seller.findUnique({
    where: { userId },
    select: { acceptsCustom: true },
  });

  if (!seller?.acceptsCustom) {
    redirect("/seller/dashboard/settings?tab=business");
  }

  return (
    <PermissionGate requiredPermission="MANAGE_SELLER_SETTINGS">
      <div className="space-y-6">
        {/* Header and breadcrumbs */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/seller/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/seller/dashboard/custom-orders">Custom Orders</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/seller/dashboard/custom-orders/create">Create Form</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Custom Order Form</h1>
            <p className="text-muted-foreground">
              Design a form to collect the information you need from customers requesting custom orders
            </p>
          </div>

          {/* Form Builder */}
          <CustomOrderFormBuilder mode="create" />
        </div>
      </div>
    </PermissionGate>
  );
} 
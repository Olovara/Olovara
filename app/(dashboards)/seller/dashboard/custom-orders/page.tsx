import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Clock } from "lucide-react";
import Link from "next/link";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import PermissionGate from "@/components/auth/permission-gate";
import CustomOrderHeader from "./CustomOrderHeader";
import CustomOrderFormsList from "./CustomOrderFormsList";
export const metadata = {
  title: "Seller - Custom Orders",
};

export default async function CustomOrdersPage() {
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

  const sellerFormIds = await db.customOrderForm.findMany({
    where: { sellerId: userId },
    select: { id: true },
  });
  const formIdList = sellerFormIds.map((f) => f.id);

  const [activeFormsCount, totalSubmissionsCount, pendingReviewCount] = await Promise.all([
    db.customOrderForm.count({
      where: { sellerId: userId, isActive: true },
    }),
    formIdList.length === 0
      ? Promise.resolve(0)
      : db.customOrderSubmission.count({
          where: { formId: { in: formIdList } },
        }),
    formIdList.length === 0
      ? Promise.resolve(0)
      : db.customOrderSubmission.count({
          where: { formId: { in: formIdList }, status: "PENDING" },
        }),
  ]);

  return (
    <PermissionGate requiredPermission="MANAGE_SELLER_SETTINGS">
      <div className="space-y-6">
        {/* Header and breadcrumbs */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Breadcrumb className="flex">
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
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Page Header */}
          <CustomOrderHeader />

          {/* Info Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-brand-dark-neutral-200 bg-brand-light-neutral-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Forms</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeFormsCount}</div>
                <p className="text-xs text-muted-foreground">
                  Forms currently accepting submissions
                </p>
              </CardContent>
            </Card>
            <Card className="border-brand-dark-neutral-200 bg-brand-light-neutral-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSubmissionsCount}</div>
                <p className="text-xs text-muted-foreground">
                  Customer requests received
                </p>
              </CardContent>
            </Card>
            <Card className="border-brand-dark-neutral-200 bg-brand-light-neutral-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingReviewCount}</div>
                <p className="text-xs text-muted-foreground">
                  Submissions awaiting your review
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Forms List */}
          <CustomOrderFormsList />
        </div>
      </div>
    </PermissionGate>
  );
} 
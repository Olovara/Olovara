import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import PermissionGate from "@/components/auth/permission-gate";
import { getSubmissionsWithPaymentStatus } from "@/actions/customOrderPaymentActions";
import CustomOrderSubmissionsView, {
  type SubmissionListItem,
} from "./CustomOrderSubmissionsView";

export const metadata = {
  title: "Seller - Custom Order Submissions",
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { formId?: string };
}

export default async function CustomOrderSubmissionsPage({
  searchParams,
}: PageProps) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const seller = await db.seller.findUnique({
    where: { userId },
    select: { acceptsCustom: true },
  });

  if (!seller?.acceptsCustom) {
    redirect("/seller/dashboard/settings?tab=business");
  }

  const rawFormId = searchParams.formId?.trim();
  const forms = await db.customOrderForm.findMany({
    where: { sellerId: userId },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
  });

  if (rawFormId && !forms.some((f) => f.id === rawFormId)) {
    notFound();
  }

  const result = await getSubmissionsWithPaymentStatus(
    rawFormId ? { formId: rawFormId } : undefined,
  );

  if (result.error) {
    return (
      <PermissionGate requiredPermission="MANAGE_SELLER_SETTINGS">
        <div className="p-6 text-destructive">{result.error}</div>
      </PermissionGate>
    );
  }

  const submissions = result.data ?? [];

  return (
    <PermissionGate requiredPermission="MANAGE_SELLER_SETTINGS">
      <div className="space-y-6">
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
                  <Link href="/seller/dashboard/custom-orders">
                    Custom Orders
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Submissions</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="space-y-6 px-4 sm:px-6">
          <Suspense
            fallback={
              <div className="text-sm text-muted-foreground">
                Loading submissions…
              </div>
            }
          >
            <CustomOrderSubmissionsView
              submissions={submissions as SubmissionListItem[]}
              forms={forms}
              initialFormId={rawFormId ?? null}
            />
          </Suspense>
        </div>
      </div>
    </PermissionGate>
  );
}

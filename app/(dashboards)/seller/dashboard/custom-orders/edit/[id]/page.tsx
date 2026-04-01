import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCustomOrderForm } from "@/actions/customOrderFormActions";
import CustomOrderFormBuilder from "@/components/seller/CustomOrderFormBuilder";
import { notFound } from "next/navigation";
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

interface EditFormPageProps {
  params: {
    id: string;
  };
}

export const metadata = {
  title: "Seller - Edit Custom Order Form",
};

export default async function EditFormPage({ params }: EditFormPageProps) {
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

  const result = await getCustomOrderForm(params.id);

  if (result.error || !result.data) {
    notFound();
  }

  const formTitle = result.data.title;

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
                  <Link href="/seller/dashboard/custom-orders">Custom Orders</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="max-w-[min(100vw-8rem,28rem)] truncate">
                  Edit: {formTitle}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Custom Order Form</h1>
            <p className="text-muted-foreground">
              Update your form fields and settings. Existing submissions will be preserved.
            </p>
          </div>

          <CustomOrderFormBuilder initialData={result.data} mode="edit" />
        </div>
      </div>
    </PermissionGate>
  );
}

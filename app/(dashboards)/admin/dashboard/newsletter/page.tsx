import { auth } from "@/auth";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import Link from "next/link";
import { redirect } from "next/navigation";
import PermissionGate from "@/components/auth/permission-gate";
import { PERMISSIONS } from "@/data/roles-and-permissions";
import NewsletterManager from "@/components/admin/NewsletterManager";

export const metadata = {
  title: "Admin - Newsletter Management",
};

export default async function AdminNewsletter() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <PermissionGate requiredPermission="SEND_BROADCASTS">
      <div className="space-y-6">
        {/* Header and breadcrumbs */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/admin/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/admin/dashboard/newsletter">Newsletter</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <NewsletterManager />
        </div>
      </div>
    </PermissionGate>
  );
} 
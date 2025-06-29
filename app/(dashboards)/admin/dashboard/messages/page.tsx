import { auth } from "@/auth";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import PermissionGate from "@/components/auth/permission-gate";
import { PERMISSIONS } from "@/data/roles-and-permissions";
import { db } from "@/lib/db";
import MessagesDashboard from "@/components/shared/MessagesDashboard";

export const metadata = {
  title: "Admin - Messages",
};

export default async function AdminMessages() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  return (
    <PermissionGate requiredPermission={"MANAGE_MESSAGES" as const}>
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
                  <Link href="/admin/dashboard/messages">Messages</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          <div className="flex items-center">
            <h1 className="font-semibold text-lg md:text-2xl">Messages</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <MessagesDashboard userType="member" />
            </CardContent>
          </Card>
        </main>
      </div>
    </PermissionGate>
  );
} 
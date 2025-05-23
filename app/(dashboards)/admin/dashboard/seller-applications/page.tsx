import { getAllSellers, getApprovedSellers, getUnapprovedSellers } from "@/actions/adminActions";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApplicationActions } from "./ApplicationActions";
import Link from "next/link";

export const metadata = {
  title: "Seller Application",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardSellerApplications({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const activeTab = (searchParams.tab as string) || "all";
  
  // Fetch applications based on active tab
  const applications = await (async () => {
    switch (activeTab) {
      case "approved":
        return await getApprovedSellers();
      case "unapproved":
        return await getUnapprovedSellers();
      default:
        return await getAllSellers();
    }
  })();

  // Helper function to generate tab URLs
  const getTabUrl = (tab: string) => {
    const params = new URLSearchParams();
    params.set("tab", tab);
    return `?${params.toString()}`;
  };

  return (
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
                <Link href="/admin/dashboard/seller-applications">Seller Applications</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {/* Main Content */}
      <Tabs defaultValue={activeTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all" asChild>
              <Link href={getTabUrl("all")}>All</Link>
            </TabsTrigger>
            <TabsTrigger value="unapproved" asChild>
              <Link href={getTabUrl("unapproved")}>Unapproved</Link>
            </TabsTrigger>
            <TabsTrigger value="approved" asChild>
              <Link href={getTabUrl("approved")}>Approved</Link>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">All Applications</h2>
            <p className="text-sm text-muted-foreground">
              View and manage all seller applications
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    <div className="font-medium">
                      {application.user.username || "No username"}
                    </div>
                    <div className="hidden text-sm text-muted-foreground md:inline">
                      {application.user.email || "No email"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={application.applicationApproved ? "default" : "outline"}>
                      {application.applicationApproved ? "Approved" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(application.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <ApplicationActions
                      application={{
                        id: application.id,
                        userId: application.userId,
                        username: application.user.username || "No username",
                        email: application.user.email || "No email",
                        craftingProcess: application.craftingProcess,
                        portfolio: application.portfolio,
                        interestInJoining: application.interestInJoining,
                        applicationApproved: application.applicationApproved,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="unapproved" className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Unapproved Applications</h2>
            <p className="text-sm text-muted-foreground">
              Review and approve pending seller applications
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    <div className="font-medium">
                      {application.user.username || "No username"}
                    </div>
                    <div className="hidden text-sm text-muted-foreground md:inline">
                      {application.user.email || "No email"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Pending</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(application.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <ApplicationActions
                      application={{
                        id: application.id,
                        userId: application.userId,
                        username: application.user.username || "No username",
                        email: application.user.email || "No email",
                        craftingProcess: application.craftingProcess,
                        portfolio: application.portfolio,
                        interestInJoining: application.interestInJoining,
                        applicationApproved: application.applicationApproved,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Approved Applications</h2>
            <p className="text-sm text-muted-foreground">
              View all approved seller applications
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    <div className="font-medium">
                      {application.user.username || "No username"}
                    </div>
                    <div className="hidden text-sm text-muted-foreground md:inline">
                      {application.user.email || "No email"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">Approved</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(application.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <ApplicationActions
                      application={{
                        id: application.id,
                        userId: application.userId,
                        username: application.user.username || "No username",
                        email: application.user.email || "No email",
                        craftingProcess: application.craftingProcess,
                        portfolio: application.portfolio,
                        interestInJoining: application.interestInJoining,
                        applicationApproved: application.applicationApproved,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}

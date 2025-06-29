import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import PermissionGate from "@/components/auth/permission-gate";
import { PERMISSIONS } from "@/data/roles-and-permissions";
import { db } from "@/lib/db";

export const metadata = {
  title: "Admin - All Orders",
};

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const activeTab = (searchParams.tab as string) || "all";
  const search = (searchParams.search as string) || "";
  const page = Number(searchParams.page) || 1;
  const pageSize = 10;

  // Get all orders with related data
  const orders = await db.order.findMany({
    include: {
      user: {
        select: {
          username: true,
          email: true,
        },
      },
      product: {
        select: {
          name: true,
          images: true,
        },
      },
      seller: {
        select: {
          shopName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Filter orders based on active tab
  const filteredOrders = orders.filter(order => {
    if (activeTab === "all") return true;
    return order.status.toLowerCase() === activeTab.toLowerCase();
  });

  // Filter orders based on search
  const searchedOrders = search
    ? filteredOrders.filter(order => 
        order.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
        order.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        order.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
        order.seller?.shopName?.toLowerCase().includes(search.toLowerCase())
      )
    : filteredOrders;

  // Pagination
  const totalItems = searchedOrders.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedOrders = searchedOrders.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Helper function to generate tab URLs while preserving search and pagination
  const getTabUrl = (tab: string) => {
    const params = new URLSearchParams();
    params.set("tab", tab);
    params.set("page", "1"); // Reset to first page when changing tabs
    if (search) {
      params.set("search", search);
    }
    return `?${params.toString()}`;
  };

  // Get status counts for tabs
  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    processing: orders.filter(o => o.status === 'PROCESSING').length,
    pending_transfer: orders.filter(o => o.status === 'PENDING_TRANSFER').length,
    completed: orders.filter(o => o.status === 'COMPLETED').length,
    failed: orders.filter(o => o.status === 'FAILED').length,
    cancelled: orders.filter(o => o.status === 'CANCELLED').length,
    refunded: orders.filter(o => o.status === 'REFUNDED').length,
  };

  return (
    <PermissionGate requiredPermission={"MANAGE_ORDERS" as const}>
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
                  <Link href="/admin/dashboard/orders">All Orders</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          <div className="flex items-center">
            <h1 className="font-semibold text-lg md:text-2xl">All Orders</h1>
          </div>

          <Tabs defaultValue={activeTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all" asChild>
                <Link href={getTabUrl("all")}>
                  All ({statusCounts.all})
                </Link>
              </TabsTrigger>
              <TabsTrigger value="pending" asChild>
                <Link href={getTabUrl("pending")}>
                  Pending ({statusCounts.pending})
                </Link>
              </TabsTrigger>
              <TabsTrigger value="processing" asChild>
                <Link href={getTabUrl("processing")}>
                  Processing ({statusCounts.processing})
                </Link>
              </TabsTrigger>
              <TabsTrigger value="pending_transfer" asChild>
                <Link href={getTabUrl("pending_transfer")}>
                  Pending Transfer ({statusCounts.pending_transfer})
                </Link>
              </TabsTrigger>
              <TabsTrigger value="completed" asChild>
                <Link href={getTabUrl("completed")}>
                  Completed ({statusCounts.completed})
                </Link>
              </TabsTrigger>
              <TabsTrigger value="failed" asChild>
                <Link href={getTabUrl("failed")}>
                  Failed ({statusCounts.failed})
                </Link>
              </TabsTrigger>
              <TabsTrigger value="cancelled" asChild>
                <Link href={getTabUrl("cancelled")}>
                  Cancelled ({statusCounts.cancelled})
                </Link>
              </TabsTrigger>
              <TabsTrigger value="refunded" asChild>
                <Link href={getTabUrl("refunded")}>
                  Refunded ({statusCounts.refunded})
                </Link>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Total</TableHead>
                        <TableHead className="hidden md:table-cell">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>{order.id}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{order.user?.username || 'Anonymous'}</span>
                              <span className="text-sm text-muted-foreground">{order.user?.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{order.product?.name || 'Unknown Product'}</span>
                              <span className="text-sm text-muted-foreground">Qty: {order.quantity}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{order.seller?.shopName || 'Unknown Seller'}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.status}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            ${(order.totalAmount / 100).toFixed(2)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {format(new Date(order.createdAt), "MMM d, yyyy")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {Math.min((page - 1) * pageSize + 1, totalItems)} to {Math.min(page * pageSize, totalItems)} of {totalItems} orders
                </div>
                <div className="flex items-center gap-2">
                  {page > 1 && (
                    <Link
                      href={`?${new URLSearchParams({
                        ...searchParams,
                        page: (page - 1).toString(),
                      }).toString()}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Previous
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`?${new URLSearchParams({
                        ...searchParams,
                        page: (page + 1).toString(),
                      }).toString()}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </PermissionGate>
  );
} 
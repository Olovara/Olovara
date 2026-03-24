import { getSellerOrders } from "@/actions/orders";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderActions } from "./OrderActions";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import PermissionGate from "@/components/auth/permission-gate";
import { PERMISSIONS } from "@/data/roles-and-permissions";

export const metadata = {
  title: "Seller - My Orders",
};

/** Tailwind classes for order status chips (brand scale). */
function orderStatusBadgeClass(status: string) {
  const s = status.toUpperCase();
  if (s === "COMPLETED") return "border-brand-success-300 bg-brand-success-50 text-brand-success-800";
  if (s === "CANCELLED" || s === "FAILED") return "border-brand-error-200 bg-brand-error-50 text-brand-error-800";
  if (s === "REFUNDED") return "border-brand-dark-neutral-300 bg-brand-light-neutral-100 text-brand-dark-neutral-800";
  if (s === "HELD" || s === "PENDING_TRANSFER") return "border-brand-warn-300 bg-brand-warn-50 text-brand-warn-900";
  if (s === "PROCESSING" || s === "PENDING") return "border-brand-primary-300 bg-brand-primary-50 text-brand-primary-800";
  return "border-brand-secondary-300 bg-brand-secondary-50 text-brand-secondary-900";
}

export default async function SellerMyOrders({
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

  const orders = await getSellerOrders(userId);

  // Filter orders based on active tab
  const filteredOrders = orders.filter(order => {
    if (activeTab === "all") return true;
    return order.status.toLowerCase() === activeTab.toLowerCase();
  });

  // Filter orders based on search
  const searchedOrders = search
    ? filteredOrders.filter(order => 
        order.buyerName?.toLowerCase().includes(search.toLowerCase()) ||
        order.buyerEmail.toLowerCase().includes(search.toLowerCase()) ||
        order.productName.toLowerCase().includes(search.toLowerCase())
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

  return (
    <PermissionGate requiredPermission="VIEW_ORDERS">
      <div className="space-y-6">
        {/* Header and breadcrumbs */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-brand-dark-neutral-200/80 bg-background/95 backdrop-blur-sm px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    href="/seller/dashboard"
                    className="text-brand-dark-neutral-600 hover:text-brand-primary-700"
                  >
                    Dashboard
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-brand-dark-neutral-400" />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    href="/seller/dashboard/my-orders"
                    className="font-medium text-brand-primary-800"
                  >
                    My Orders
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Main Content */}
        <main className="grid flex-1 items-start gap-4 rounded-xl border border-brand-dark-neutral-200/70 bg-gradient-to-b from-brand-primary-50/50 via-background to-brand-light-neutral-50/40 p-4 shadow-sm sm:px-6 sm:py-6 md:gap-8">
          <Tabs defaultValue={activeTab} className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <TabsList className="h-auto flex-wrap justify-start gap-1 bg-brand-primary-100/70 p-1.5 text-brand-dark-neutral-700">
                <TabsTrigger
                  value="all"
                  asChild
                  className="rounded-md px-3 py-2 data-[state=active]:bg-white data-[state=active]:text-brand-primary-700 data-[state=active]:shadow-sm"
                >
                  <Link href={getTabUrl("all")}>All</Link>
                </TabsTrigger>
                <TabsTrigger
                  value="processing"
                  asChild
                  className="rounded-md px-3 py-2 data-[state=active]:bg-white data-[state=active]:text-brand-primary-700 data-[state=active]:shadow-sm"
                >
                  <Link href={getTabUrl("processing")}>Processing</Link>
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  asChild
                  className="rounded-md px-3 py-2 data-[state=active]:bg-white data-[state=active]:text-brand-primary-700 data-[state=active]:shadow-sm"
                >
                  <Link href={getTabUrl("completed")}>Completed</Link>
                </TabsTrigger>
                <TabsTrigger
                  value="cancelled"
                  asChild
                  className="rounded-md px-3 py-2 data-[state=active]:bg-white data-[state=active]:text-brand-primary-700 data-[state=active]:shadow-sm"
                >
                  <Link href={getTabUrl("cancelled")}>Cancelled</Link>
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search orders..."
                  className="h-9 w-full min-w-[200px] rounded-md border border-brand-dark-neutral-200 bg-background px-3 py-1 text-sm text-brand-dark-neutral-900 shadow-sm transition-colors placeholder:text-brand-dark-neutral-500 focus-visible:border-brand-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-[220px]"
                  defaultValue={search}
                />
              </div>
            </div>

            <TabsContent value={activeTab} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold tracking-tight text-brand-dark-neutral-900">
                    {activeTab === "all" ? "All Orders" : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Orders`}
                  </h2>
                  <p className="text-sm text-brand-dark-neutral-600">
                    {search
                      ? `Search results for "${search}"`
                      : `Manage your ${activeTab === "all" ? "" : activeTab} orders`}
                  </p>
                </div>
              </div>

              <Card className="overflow-hidden border-brand-dark-neutral-200/90 shadow-sm">
                <CardContent className="p-0">
                  {paginatedOrders.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center gap-2 bg-brand-primary-50/30 px-4">
                      <p className="font-medium text-brand-dark-neutral-800">No orders found.</p>
                      <p className="text-center text-sm text-brand-dark-neutral-600">
                        Try another tab or adjust your search.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-brand-dark-neutral-200 bg-brand-primary-50/90 hover:bg-brand-primary-50/90">
                          <TableHead className="font-semibold text-brand-primary-800">Order ID</TableHead>
                          <TableHead className="font-semibold text-brand-primary-800">Customer</TableHead>
                          <TableHead className="font-semibold text-brand-primary-800">Status</TableHead>
                          <TableHead className="hidden font-semibold text-brand-primary-800 md:table-cell">Total</TableHead>
                          <TableHead className="hidden font-semibold text-brand-primary-800 md:table-cell">Date</TableHead>
                          <TableHead className="font-semibold text-brand-primary-800">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedOrders.map((order) => (
                          <TableRow
                            key={order.id}
                            className="border-brand-dark-neutral-100 hover:bg-brand-primary-50/40"
                          >
                            <TableCell className="font-mono text-xs text-brand-dark-neutral-800 md:text-sm">
                              {order.id}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-brand-dark-neutral-900">{order.buyerName || 'Anonymous'}</span>
                                <span className="text-sm text-brand-dark-neutral-600">{order.buyerEmail}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`font-medium ${orderStatusBadgeClass(order.status)}`}
                              >
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden font-medium text-brand-dark-neutral-900 md:table-cell">
                              ${(order.totalAmount / 100).toFixed(2)}
                            </TableCell>
                            <TableCell className="hidden text-brand-dark-neutral-700 md:table-cell">
                              {format(new Date(order.createdAt), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                              <OrderActions order={{
                                ...order,
                                shopName: order.shopName || "Unknown Shop",
                                seller: {
                                  id: order.sellerId,
                                  userId: order.sellerId,
                                  shopName: order.shopName || "Unknown Shop"
                                },
                                product: {
                                  id: order.productId,
                                  name: order.productName,
                                  images: order.product?.images || []
                                }
                              }} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Pagination */}
              <div className="flex flex-col gap-2 border-t border-brand-dark-neutral-200/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-brand-dark-neutral-600">
                  Showing {Math.min((page - 1) * pageSize + 1, totalItems)} to {Math.min(page * pageSize, totalItems)} of {totalItems} orders
                </div>
                <div className="flex items-center gap-3">
                  {page > 1 && (
                    <Link
                      href={`?${new URLSearchParams({
                        ...searchParams,
                        page: (page - 1).toString(),
                      }).toString()}`}
                      className="text-sm font-medium text-brand-primary-700 hover:text-brand-primary-600 hover:underline"
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
                      className="text-sm font-medium text-brand-primary-700 hover:text-brand-primary-600 hover:underline"
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
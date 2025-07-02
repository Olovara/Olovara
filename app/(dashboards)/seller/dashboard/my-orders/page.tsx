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
                  <Link href="/seller/dashboard/my-orders">My Orders</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Main Content */}
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Tabs defaultValue={activeTab} className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="all" asChild>
                  <Link href={getTabUrl("all")}>All</Link>
                </TabsTrigger>
                <TabsTrigger value="processing" asChild>
                  <Link href={getTabUrl("processing")}>Processing</Link>
                </TabsTrigger>
                <TabsTrigger value="completed" asChild>
                  <Link href={getTabUrl("completed")}>Completed</Link>
                </TabsTrigger>
                <TabsTrigger value="cancelled" asChild>
                  <Link href={getTabUrl("cancelled")}>Cancelled</Link>
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search orders..."
                  className="h-9 w-[200px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue={search}
                />
              </div>
            </div>

            <TabsContent value={activeTab} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {activeTab === "all" ? "All Orders" : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Orders`}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {search
                      ? `Search results for "${search}"`
                      : `Manage your ${activeTab === "all" ? "" : activeTab} orders`}
                  </p>
                </div>
              </div>

              <Card>
                <CardContent className="p-0">
                  {paginatedOrders.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                      <p className="text-muted-foreground">No orders found.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden md:table-cell">Total</TableHead>
                          <TableHead className="hidden md:table-cell">Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>{order.id}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{order.buyerName || 'Anonymous'}</span>
                                <span className="text-sm text-muted-foreground">{order.buyerEmail}</span>
                              </div>
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
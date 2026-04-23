import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PurchaseActions } from "@/actions/PurchaseActions";
import CustomOrderCompletedListActions from "@/components/custom-order/CustomOrderCompletedListActions";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { getBuyerOrders } from "@/actions/orders";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export const metadata = {
  title: "Seller - My Purchases",
};

export default async function MyPurchasesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const activeTab = (searchParams.tab as string) || "all";
  const search = (searchParams.search as string) || "";
  const page = Number(searchParams.page) || 1;
  const pageSize = 10;

  const purchases = await getBuyerOrders(session.user.id);

  // Filter purchases: marketplace orders match tab by status; completed custom orders appear under All + Delivered
  const filteredPurchases = purchases.filter((purchase) => {
    if (activeTab === "all") return true;
    if (purchase.source === "custom_order") {
      return activeTab === "delivered";
    }
    return purchase.status.toLowerCase() === activeTab.toLowerCase();
  });

  // Filter purchases based on search
  const searchedPurchases = search
    ? filteredPurchases.filter(purchase => 
        purchase.product.name.toLowerCase().includes(search.toLowerCase()) ||
        purchase.shopName.toLowerCase().includes(search.toLowerCase())
      )
    : filteredPurchases;

  // Pagination
  const totalItems = searchedPurchases.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedPurchases = searchedPurchases.slice(
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500";
      case "PROCESSING":
        return "bg-blue-500";
      case "SHIPPED":
        return "bg-purple-500";
      case "DELIVERED":
      case "COMPLETED":
        return "bg-green-500";
      case "CANCELLED":
        return "bg-red-500";
      case "REFUNDED":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
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
                <Link href="/seller/dashboard/my-purchases">My Purchases</Link>
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
              <TabsTrigger value="shipped" asChild>
                <Link href={getTabUrl("shipped")}>Shipped</Link>
              </TabsTrigger>
              <TabsTrigger value="delivered" asChild>
                <Link href={getTabUrl("delivered")}>Delivered</Link>
              </TabsTrigger>
              <TabsTrigger value="cancelled" asChild>
                <Link href={getTabUrl("cancelled")}>Cancelled</Link>
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search purchases..."
                className="h-9 w-[200px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue={search}
              />
            </div>
          </div>

          <TabsContent value={activeTab} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">
                  {activeTab === "all" ? "All Purchases" : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Purchases`}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {search
                    ? `Search results for "${search}"`
                    : `View your ${activeTab === "all" ? "" : activeTab} purchases`}
                </p>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                {paginatedPurchases.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">You haven&apos;t made any purchases yet.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Total</TableHead>
                        <TableHead className="hidden md:table-cell">Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPurchases.map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell>
                            <span className="inline-flex flex-wrap items-center gap-1">
                              {purchase.id.substring(0, 8)}…
                              {purchase.source === "custom_order" && (
                                <Badge variant="secondary" className="text-[10px]">
                                  Custom
                                </Badge>
                              )}
                            </span>
                          </TableCell>
                          <TableCell>{purchase.product.name}</TableCell>
                          <TableCell>{purchase.shopName}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(purchase.status)}>
                              {purchase.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {purchase.source === "custom_order"
                              ? formatPrice(purchase.totalAmount, { isCents: true })
                              : formatPrice(
                                  (purchase.totalAmount -
                                    (() => {
                                      if (typeof purchase.discount === "number") return purchase.discount;
                                      if (typeof purchase.discount === "string") return parseFloat(purchase.discount) || 0;
                                      return 0;
                                    })()) / 100
                                )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {format(new Date(purchase.createdAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            {purchase.source === "custom_order" ? (
                              <CustomOrderCompletedListActions role="buyer" />
                            ) : (
                              <PurchaseActions
                                purchase={(() => {
                                  const { source: _s, ...rest } = purchase;
                                  return {
                                    ...rest,
                                    buyerName: rest.buyerName ?? undefined,
                                  };
                                })()}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {Math.min((page - 1) * pageSize + 1, totalItems)} to {Math.min(page * pageSize, totalItems)} of {totalItems} purchases
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
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
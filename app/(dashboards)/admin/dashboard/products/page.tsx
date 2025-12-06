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
import { ProductInteractionService } from "@/lib/analytics";

export const metadata = {
  title: "Admin - All Products",
};

export default async function AdminProducts({
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

  // Get all products with related data
  const products = await db.product.findMany({
    include: {
      seller: {
        select: {
          shopName: true,
          shopNameSlug: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Get view counts for all products
  const productViewCounts = await ProductInteractionService.getAllProductViewCounts();
  const viewCountMap = new Map(
    productViewCounts.map(v => [v.productId, v.views])
  );

  // Filter products based on active tab
  const filteredProducts = products.filter(product => {
    if (activeTab === "all") return true;
    return product.status.toLowerCase() === activeTab.toLowerCase();
  });

  // Filter products based on search
  const searchedProducts = search
    ? filteredProducts.filter(product => 
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.seller?.shopName?.toLowerCase().includes(search.toLowerCase())
      )
    : filteredProducts;

  // Pagination
  const totalItems = searchedProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedProducts = searchedProducts.slice(
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
    all: products.length,
    active: products.filter(p => p.status === 'ACTIVE').length,
    hidden: products.filter(p => p.status === 'HIDDEN').length,
    disabled: products.filter(p => p.status === 'DISABLED').length,
  };

  return (
    <PermissionGate requiredPermission="MANAGE_PRODUCTS">
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
                  <Link href="/admin/dashboard/products">All Products</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          <div className="flex items-center">
            <h1 className="font-semibold text-lg md:text-2xl">All Products</h1>
          </div>

          <Tabs defaultValue={activeTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all" asChild>
                <Link href={getTabUrl("all")}>
                  All ({statusCounts.all})
                </Link>
              </TabsTrigger>
              <TabsTrigger value="active" asChild>
                <Link href={getTabUrl("active")}>
                  Active ({statusCounts.active})
                </Link>
              </TabsTrigger>
              <TabsTrigger value="hidden" asChild>
                <Link href={getTabUrl("hidden")}>
                  Hidden ({statusCounts.hidden})
                </Link>
              </TabsTrigger>
              <TabsTrigger value="disabled" asChild>
                <Link href={getTabUrl("disabled")}>
                  Disabled ({statusCounts.disabled})
                </Link>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Views</TableHead>
                        <TableHead className="hidden md:table-cell">Stock</TableHead>
                        <TableHead className="hidden md:table-cell">Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{product.name}</span>
                              <span className="text-sm text-muted-foreground">ID: {product.id}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Link 
                              href={`/shops/${product.seller?.shopNameSlug}`}
                              className="text-primary hover:underline"
                            >
                              {product.seller?.shopName || 'Unknown Seller'}
                            </Link>
                          </TableCell>
                          <TableCell>
                            ${(product.price / 100).toFixed(2)} {product.currency}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.status}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {viewCountMap.get(product.id)?.toLocaleString() || '0'}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {product.stock}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {format(new Date(product.createdAt), "MMM d, yyyy")}
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
                  Showing {Math.min((page - 1) * pageSize + 1, totalItems)} to {Math.min(page * pageSize, totalItems)} of {totalItems} products
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
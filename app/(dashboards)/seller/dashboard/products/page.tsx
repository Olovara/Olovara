import { getSellerProducts } from "@/actions/product";
import { auth } from "@/auth";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ProductSearch } from "./ProductSearch";
import { ProductTable } from "./ProductTable";
import { PaginationControls } from "./PaginationControls";
import { redirect } from "next/navigation";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SELLER") {
    redirect("/auth/signin");
  }

  const activeTab = (searchParams.tab as string) || "all";
  const search = (searchParams.search as string) || "";
  const page = Number(searchParams.page) || 1;
  const pageSize = 10;

  // Get products based on active tab and search
  const { products, totalItems, totalPages } = await getSellerProducts(
    session.user.id,
    activeTab === "all" ? undefined : activeTab,
    search,
    pageSize,
    page
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
                <Link href="/seller/dashboard/products">Products</Link>
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
              <TabsTrigger value="active" asChild>
                <Link href={getTabUrl("active")}>Active</Link>
              </TabsTrigger>
              <TabsTrigger value="hidden" asChild>
                <Link href={getTabUrl("hidden")}>Hidden</Link>
              </TabsTrigger>
              <TabsTrigger value="disabled" asChild>
                <Link href={getTabUrl("disabled")}>Disabled</Link>
              </TabsTrigger>
            </TabsList>
            <ProductSearch initialQuery={search} />
          </div>

          <TabsContent
            key={`all-${page}-${search}`}
            value="all"
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">
                  All Products
                </h2>
                <p className="text-sm text-muted-foreground">
                  {search
                    ? `Search results for "${search}"`
                    : "Manage all your products"}
                </p>
              </div>
              <Link href="/seller/dashboard/products/create-product">
                <Button>Add Product</Button>
              </Link>
            </div>
            <ProductTable products={products} />
            <PaginationControls
              totalPages={totalPages}
              currentPage={page}
              totalItems={totalItems}
              pageSize={pageSize}
              activeTab={activeTab}
              searchQuery={search}
            />
          </TabsContent>

          <TabsContent
            key={`active-${page}-${search}`}
            value="active"
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Active Products
                </h2>
                <p className="text-sm text-muted-foreground">
                  {search
                    ? `Search results for "${search}"`
                    : "Products currently visible to customers"}
                </p>
              </div>
              <Link href="/seller/dashboard/products/new">
                <Button>Add Product</Button>
              </Link>
            </div>
            <ProductTable products={products} />
            <PaginationControls
              totalPages={totalPages}
              currentPage={page}
              totalItems={totalItems}
              pageSize={pageSize}
              activeTab={activeTab}
              searchQuery={search}
            />
          </TabsContent>

          <TabsContent
            key={`hidden-${page}-${search}`}
            value="hidden"
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Hidden Products
                </h2>
                <p className="text-sm text-muted-foreground">
                  {search
                    ? `Search results for "${search}"`
                    : "Products temporarily hidden from customers"}
                </p>
              </div>
              <Link href="/seller/dashboard/products/new">
                <Button>Add Product</Button>
              </Link>
            </div>
            <ProductTable products={products} />
            <PaginationControls
              totalPages={totalPages}
              currentPage={page}
              totalItems={totalItems}
              pageSize={pageSize}
              activeTab={activeTab}
              searchQuery={search}
            />
          </TabsContent>

          <TabsContent
            key={`disabled-${page}-${search}`}
            value="disabled"
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Disabled Products
                </h2>
                <p className="text-sm text-muted-foreground">
                  {search
                    ? `Search results for "${search}"`
                    : "Products that are not available for sale"}
                </p>
              </div>
              <Link href="/seller/dashboard/products/new">
                <Button>Add Product</Button>
              </Link>
            </div>
            <ProductTable products={products} />
            <PaginationControls
              totalPages={totalPages}
              currentPage={page}
              totalItems={totalItems}
              pageSize={pageSize}
              activeTab={activeTab}
              searchQuery={search}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

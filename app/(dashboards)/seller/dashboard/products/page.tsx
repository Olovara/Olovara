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
import { redirect } from "next/navigation";
import SuspendedPaginationControls from "./PaginationControls";
import PermissionGate from "@/components/auth/permission-gate";
import { PERMISSIONS } from "@/data/roles-and-permissions";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const activeTab = (searchParams.tab as string) || "all";
  const search = (searchParams.search as string) || "";
  const page = Number(searchParams.page) || 1;
  const pageSize = 10;

  // Get products based on active tab and search
  const { products, totalItems, totalPages } = await getSellerProducts(
    activeTab === "all" ? undefined : activeTab,
    search,
    pageSize,
    page
  );

  // Transform the products data to match the expected types
  const transformedProducts = products.map(product => {
    // Handle description transformation
    let transformedDescription: string | { html: string; text: string } | null = null;
    
    if (product.description) {
      if (typeof product.description === 'string') {
        transformedDescription = product.description;
      } else if (typeof product.description === 'object') {
        // Ensure the object has the required properties
        const desc = product.description as any;
        if (desc.html || desc.text) {
          transformedDescription = {
            html: desc.html || '',
            text: desc.text || ''
          };
        }
      }
    }

    return {
      ...product,
      description: transformedDescription
    };
  });

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
    <PermissionGate requiredPermission="MANAGE_PRODUCTS">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
                <BreadcrumbLink href="/seller/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <BreadcrumbLink href="/seller/dashboard/products">Products</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
          <Link href="/seller/dashboard/products/create-product">
            <Button>Create Product</Button>
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Tabs defaultValue={activeTab} className="w-full">
            <TabsList>
              <TabsTrigger value="all" asChild>
                  <Link href={{ pathname: "/seller/dashboard/products", query: { ...searchParams, tab: "all" } }}>
                    All
                  </Link>
              </TabsTrigger>
                <TabsTrigger value="ACTIVE" asChild>
                  <Link href={{ pathname: "/seller/dashboard/products", query: { ...searchParams, tab: "ACTIVE" } }}>
                    Active
                  </Link>
              </TabsTrigger>
                <TabsTrigger value="HIDDEN" asChild>
                  <Link href={{ pathname: "/seller/dashboard/products", query: { ...searchParams, tab: "HIDDEN" } }}>
                    Hidden
                  </Link>
              </TabsTrigger>
                <TabsTrigger value="DISABLED" asChild>
                  <Link href={{ pathname: "/seller/dashboard/products", query: { ...searchParams, tab: "DISABLED" } }}>
                    Disabled
                  </Link>
              </TabsTrigger>
            </TabsList>
              <ProductSearch />
              <TabsContent value={activeTab}>
            <ProductTable products={transformedProducts} />
            <SuspendedPaginationControls
              totalPages={totalPages}
              currentPage={page}
              totalItems={totalItems}
              pageSize={pageSize}
              activeTab={activeTab}
              searchQuery={search}
            />
          </TabsContent>
        </Tabs>
          </div>
        </div>
    </div>
    </PermissionGate>
  );
}

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import PermissionGate from "@/components/auth/permission-gate";
import { getProductsForSocialMedia } from "@/actions/adminActions";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Image as ImageIcon, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { SocialMediaPostsClient } from "./SocialMediaPostsClient";
import { CopyableUrl } from "./CopyableUrl";
import { ExpandableDescription } from "./ExpandableDescription";

export const metadata = {
  title: "Admin - Social Media Posts",
};

export const dynamic = "force-dynamic";

export default async function SocialMediaPostsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const search = (searchParams.search as string) || "";
  const status = (searchParams.status as string) || "ACTIVE";
  const page = Number(searchParams.page) || 1;

  // Fetch products for social media
  let productsData;
  try {
    productsData = await getProductsForSocialMedia({
      search,
      status,
      page,
      limit: 12,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    productsData = {
      products: [],
      pagination: { page: 1, limit: 12, total: 0, pages: 0 },
    };
  }

  return (
    <PermissionGate requiredPermission="ACCESS_ADMIN_DASHBOARD">
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
                  <Link href="/admin/dashboard/social-media-posts">
                    Social Media Posts
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-semibold text-lg md:text-2xl">
                Social Media Posts Tool
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                View all product information, images, and URLs in one place for
                easy copying to Instagram, Pinterest, etc.
              </p>
            </div>
          </div>

          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter Products</CardTitle>
            </CardHeader>
            <CardContent>
              <SocialMediaPostsClient
                initialSearch={search}
                initialStatus={status}
                initialPage={page}
              />
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {productsData.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {productsData.products.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No products found. Try adjusting your search or filters.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {productsData.pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {Math.min(
                  (page - 1) * productsData.pagination.limit + 1,
                  productsData.pagination.total
                )}{" "}
                to{" "}
                {Math.min(
                  page * productsData.pagination.limit,
                  productsData.pagination.total
                )}{" "}
                of {productsData.pagination.total} products
              </div>
              <div className="flex items-center gap-2">
                {page > 1 && (
                  <Button
                    variant="outline"
                    asChild
                    size="sm"
                  >
                    <Link
                      href={`?${new URLSearchParams({
                        ...(search && { search }),
                        ...(status && status !== "ACTIVE" && { status }),
                        page: (page - 1).toString(),
                      }).toString()}`}
                    >
                      Previous
                    </Link>
                  </Button>
                )}
                {page < productsData.pagination.pages && (
                  <Button
                    variant="outline"
                    asChild
                    size="sm"
                  >
                    <Link
                      href={`?${new URLSearchParams({
                        ...(search && { search }),
                        ...(status && status !== "ACTIVE" && { status }),
                        page: (page + 1).toString(),
                      }).toString()}`}
                    >
                      Next
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </PermissionGate>
  );
}

// Product Card Component - displays all product info without requiring clicks
function ProductCard({ product }: { product: any }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{product.name}</CardTitle>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={product.status === "ACTIVE" ? "default" : "outline"}>
                {product.status}
              </Badge>
              {product.onSale && (
                <Badge variant="destructive">On Sale</Badge>
              )}
              {product.isDigital && (
                <Badge variant="secondary">Digital</Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Product Images with URLs */}
        {product.imageUrls && product.imageUrls.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Product Images ({product.imageUrls.length})
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {product.imageUrls.map((imageUrl: string, index: number) => {
                // Check if image is from a known domain that supports optimization
                const isKnownDomain = 
                  imageUrl.includes("utfs.io") ||
                  imageUrl.includes(".ufs.sh") ||
                  imageUrl.includes(process.env.NEXT_PUBLIC_APP_URL || "yarnnu.com");
                
                return (
                  <div key={index} className="space-y-1">
                    <div className="relative aspect-square rounded-md overflow-hidden border bg-muted">
                      <Image
                        src={imageUrl}
                        alt={`${product.name} - Image ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 33vw"
                        unoptimized={!isKnownDomain}
                      />
                    </div>
                    <CopyableUrl url={imageUrl} label={`Image ${index + 1}`} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Separator />

        {/* Product URL */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Product URL on Yarnnu
          </h3>
          <CopyableUrl url={product.productUrl} label="Product URL" />
        </div>

        <Separator />

        {/* Price Information */}
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Price</h3>
          <div className="flex items-center gap-2">
            {product.onSale && product.salePrice ? (
              <>
                <span className="text-lg font-bold text-destructive">
                  ${product.salePrice} {product.currency}
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  ${product.formattedPrice}
                </span>
                <span className="text-sm text-destructive font-medium">
                  {product.discount}% OFF
                </span>
              </>
            ) : (
              <span className="text-lg font-bold">
                ${product.formattedPrice} {product.currency}
              </span>
            )}
          </div>
        </div>

        <Separator />

        {/* Seller Information */}
        {product.seller && (
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">Seller</h3>
            <p className="text-sm">{product.seller.shopName}</p>
            {product.seller.shopTagLine && (
              <p className="text-xs text-muted-foreground">
                {product.seller.shopTagLine}
              </p>
            )}
          </div>
        )}

        <Separator />

        {/* Short Description */}
        {product.shortDescription && (
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">Short Description</h3>
            <ExpandableDescription
              text={product.shortDescription}
              maxLength={150}
            />
          </div>
        )}

        {/* Description Bullets */}
        {product.shortDescriptionBullets &&
          product.shortDescriptionBullets.length > 0 && (
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">Key Points</h3>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                {product.shortDescriptionBullets.map(
                  (bullet: string, index: number) => (
                    <li key={index}>{bullet}</li>
                  )
                )}
              </ul>
            </div>
          )}

        {/* Full Description */}
        {product.descriptionText && (
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">Full Description</h3>
            <ExpandableDescription
              text={product.descriptionText}
              maxLength={200}
            />
          </div>
        )}

        {/* Categories */}
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Categories</h3>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">
              {product.primaryCategory}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {product.secondaryCategory}
            </Badge>
            {product.tertiaryCategory && (
              <Badge variant="outline" className="text-xs">
                {product.tertiaryCategory}
              </Badge>
            )}
          </div>
        </div>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">Tags</h3>
            <div className="flex flex-wrap gap-1">
              {product.tags.map((tag: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Material Tags */}
        {product.materialTags && product.materialTags.length > 0 && (
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">Materials</h3>
            <div className="flex flex-wrap gap-1">
              {product.materialTags.map((tag: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>
            <span className="font-medium">Stock:</span> {product.stock}
          </div>
          {product.sku && (
            <div>
              <span className="font-medium">SKU:</span> {product.sku}
            </div>
          )}
          <div>
            <span className="font-medium">Created:</span>{" "}
            {format(new Date(product.createdAt), "MMM d, yyyy")}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



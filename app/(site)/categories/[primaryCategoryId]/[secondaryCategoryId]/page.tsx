import { db } from "@/lib/db";
import { Categories, getTertiaryCategories } from "@/data/categories";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductFilters } from "@/components/ProductFilters";
import ProductCard from "@/components/ProductCard";
import { getUserCountryCode } from "@/actions/locationFilterActions";
import { createProductFilterWhereClause, getProductFilterConfig, debugProductQuery } from "@/lib/product-filtering";
import { WebsiteStructuredData } from "@/components/WebsiteStructuredData";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { getFollowedSellersFeed } from "@/actions/followActions";
import {
  PaginationControlsAndSizeSelector,
  PaginationInfoAndSizeSelector,
} from "@/components/PaginationComponent";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Filter } from "lucide-react";

interface CategoryPageProps {
  params: {
    primaryCategoryId: string;
    secondaryCategoryId: string;
  };
  searchParams: {
    priceRange?: string;
    sortBy?: string;
    q?: string;
    page?: string;
    size?: string;
    values?: string;
    followedSellers?: string;
  };
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const primaryCategory = Categories.find(
    (c) => c.id.toLowerCase() === params.primaryCategoryId.toLowerCase()
  );
  const secondaryCategory = primaryCategory?.children.find(
    (c) => c.id.toLowerCase() === params.secondaryCategoryId.toLowerCase()
  );

  if (!primaryCategory || !secondaryCategory) {
    return {
      title: "Category Not Found | Yarnnu",
    };
  }

  return {
    title: `${secondaryCategory.name} ${primaryCategory.name} | Yarnnu`,
    description: `Shop our collection of ${secondaryCategory.name.toLowerCase()} ${primaryCategory.name.toLowerCase()}. Find unique handmade items in this category.`,
    alternates: {
      canonical: `https://yarnnu.com/categories/${params.primaryCategoryId.toLowerCase()}/${params.secondaryCategoryId.toLowerCase()}`,
    },
    openGraph: {
      title: `${secondaryCategory.name} ${primaryCategory.name} | Yarnnu`,
      description: `Shop our collection of ${secondaryCategory.name.toLowerCase()} ${primaryCategory.name.toLowerCase()}. Find unique handmade items in this category.`,
    },
  };
}

export default async function SecondaryCategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  // Get user's country code for location-based filtering
  const userCountryCode = await getUserCountryCode();
  // Get centralized filter configuration
  const filterConfig = await getProductFilterConfig(userCountryCode || undefined);

  // Get user session for followed sellers filter
  const session = await auth();

  const { primaryCategoryId, secondaryCategoryId } = params;

  const primaryCategory = Categories.find(
    (c) => c.id.toLowerCase() === primaryCategoryId.toLowerCase()
  );
  const secondaryCategory = primaryCategory?.children.find(
    (c) => c.id.toLowerCase() === secondaryCategoryId.toLowerCase()
  );

  if (!primaryCategory || !secondaryCategory) {
    notFound();
  }

  // Parse filters - match the main products page format
  const priceRange = searchParams.priceRange?.split(",").map(Number) || [0, 1000];
  const sortBy = searchParams.sortBy || "relevant";
  const currentPage = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.size) || 24;
  const values = searchParams.values?.split(",") || [];
  const followedSellers = searchParams.followedSellers === "true";

  // Build additional filters - match the main products page structure
  const additionalFilters: Prisma.ProductWhereInput = {
    AND: [
      {
        primaryCategory: primaryCategoryId,
        secondaryCategory: secondaryCategoryId,
        price: {
          gte: priceRange[0] * 100, // Convert to cents
          lte: priceRange[1] * 100, // Convert to cents
        },
      },
      ...(searchParams.q
        ? [
          {
            name: {
              contains: searchParams.q,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ]
        : []),
      ...(values.length > 0
        ? [
          {
            seller: {
              OR: values.map((value) => ({
                [value]: true,
              })),
            },
          },
        ]
        : []),
    ],
  };

  // Handle followed sellers filter
  let productsWithActiveSellers;

  if (followedSellers && session?.user?.id) {
    // Get products from followed sellers
    const followedProducts = await getFollowedSellersFeed(1000);
    const followedProductIds = followedProducts.map((p) => p.id);

    // Apply additional filters to followed products
    const where = await createProductFilterWhereClause(additionalFilters, filterConfig);
    const allFilteredProducts = await debugProductQuery(where);

    // Filter to only include followed products
    productsWithActiveSellers = allFilteredProducts.filter((product) =>
      followedProductIds.includes(product.id)
    );
  } else {
    // Use centralized filtering for all products
    const where = await createProductFilterWhereClause(additionalFilters, filterConfig);
    productsWithActiveSellers = await debugProductQuery(where);
  }

  // Build orderBy clause - match the main products page
  const orderBy = (() => {
    switch (sortBy) {
      case "relevant":
        const hasFilters =
          values.length > 0 ||
          followedSellers ||
          searchParams.q ||
          priceRange[0] !== 0 ||
          priceRange[1] !== 1000;
        if (hasFilters) {
          return { createdAt: Prisma.SortOrder.desc };
        } else {
          return undefined;
        }
      case "price-asc":
        return { price: Prisma.SortOrder.asc };
      case "price-desc":
        return { price: Prisma.SortOrder.desc };
      case "popular":
        return { numberSold: Prisma.SortOrder.desc };
      case "newest":
        return { createdAt: Prisma.SortOrder.desc };
      default:
        return { createdAt: Prisma.SortOrder.desc };
    }
  })();

  // Get total count for pagination
  const totalProducts = productsWithActiveSellers.length;
  const totalPages = Math.ceil(totalProducts / pageSize);

  // Fetch products with pagination and full details
  const allProducts = await db.product.findMany({
    where: {
      id: {
        in: productsWithActiveSellers.map((p) => p.id),
      },
    },
    ...(orderBy && { orderBy }),
    skip: (currentPage - 1) * pageSize,
    take: pageSize * 2, // Fetch more to account for filtering
    select: {
      id: true,
      name: true,
      price: true,
      currency: true,
      images: true,
      primaryCategory: true,
      secondaryCategory: true,
      tertiaryCategory: true,
      status: true,
      isDigital: true,
      onSale: true,
      discount: true,
      saleStartDate: true,
      saleEndDate: true,
      saleStartTime: true,
      saleEndTime: true,
      stock: true,
      dropDate: true,
      dropTime: true,
      seller: {
        select: {
          shopName: true,
          shopNameSlug: true,
          shopValues: true,
          excludedCountries: true,
        },
      },
    },
  });

  // Merge the seller information from the debug query with the full product data
  const productsWithSellerInfo = allProducts.map((product) => {
    const debugProduct = productsWithActiveSellers.find((p) => p.id === product.id);
    return {
      ...product,
      seller: debugProduct?.seller || product.seller,
    };
  });

  // Apply location filtering in memory
  let filteredProducts = userCountryCode
    ? productsWithSellerInfo.filter((product) => {
      if (!product.seller) return true;
      const excludedCountries = product.seller.excludedCountries || [];
      return !excludedCountries.includes(userCountryCode);
    })
    : productsWithSellerInfo;

  // Apply random sorting for "relevant" when no filters are applied
  if (sortBy === "relevant" && !orderBy) {
    for (let i = filteredProducts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filteredProducts[i], filteredProducts[j]] = [
        filteredProducts[j],
        filteredProducts[i],
      ];
    }
  }

  const products = filteredProducts.slice(0, pageSize);

  return (
    <div className="container mx-auto px-4 py-8 max-w-[2000px]">
      <div className="mb-8">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
          <a href="/categories" className="hover:text-primary">Categories</a>
          <span>/</span>
          <a href={`/categories/${primaryCategoryId}`} className="hover:text-primary">
            {primaryCategory.name}
          </a>
          <span>/</span>
          <span className="text-foreground">{secondaryCategory.name}</span>
        </nav>

        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          {secondaryCategory.name} {primaryCategory.name}
        </h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Browse our collection of {secondaryCategory.name.toLowerCase()}{" "}
          {primaryCategory.name.toLowerCase()}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Mobile Filters Button */}
        <div className="lg:hidden flex justify-end">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <ProductFilters />
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Filters Sidebar */}
        <div className="hidden lg:block w-1/5">
          <div className="sticky top-4">
            {/* Tertiary Categories Sidebar */}
            {(() => {
              const tertiaryCategories = getTertiaryCategories(secondaryCategoryId);
              return tertiaryCategories.length > 0 ? (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-4">Subcategories</h2>
                  <ul className="space-y-2">
                    {tertiaryCategories.map((tertiaryId) => {
                      const tertiaryCategory = ("children" in secondaryCategory && secondaryCategory.children)
                        ? secondaryCategory.children.find(t => t.id === tertiaryId)
                        : undefined;
                      return tertiaryCategory ? (
                        <li key={tertiaryId}>
                          <a
                            href={`/categories/${primaryCategoryId}/${secondaryCategoryId}/${tertiaryId.toLowerCase()}`}
                            className="text-gray-600 hover:text-primary"
                          >
                            {tertiaryCategory.name}
                          </a>
                        </li>
                      ) : null;
                    })}
                  </ul>
                </div>
              ) : null;
            })()}

            <ProductFilters />
          </div>
        </div>

        {/* Products Grid */}
        <div className="w-full lg:w-4/5">
          {/* Pagination Info */}
          {totalPages > 1 && (
            <div className="mb-6">
              <PaginationInfoAndSizeSelector
                totalCount={totalProducts}
                pageNumber={currentPage}
                pageSize={pageSize}
              />
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  secondaryCategory: product.secondaryCategory || undefined,
                  tertiaryCategory: product.tertiaryCategory || undefined,
                  onSale: product.onSale,
                  saleStartDate: product.saleStartDate,
                  saleEndDate: product.saleEndDate,
                  saleStartTime: product.saleStartTime,
                  saleEndTime: product.saleEndTime,
                }}
                index={index}
              />
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-12">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-semibold mb-4">Discover Amazing {secondaryCategory.name} {primaryCategory.name}</h2>
                <p className="text-gray-600 mb-6">
                  We&apos;re constantly adding new {secondaryCategory.name.toLowerCase()} {primaryCategory.name.toLowerCase()} products from talented artisans. Check back soon to find unique handmade items in this category.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2">Handmade Quality</h3>
                    <p>Every item is carefully crafted by skilled artisans</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2">Unique Designs</h3>
                    <p>Find one-of-a-kind pieces you won&apos;t see anywhere else</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8">
              <PaginationControlsAndSizeSelector
                totalCount={totalProducts}
                pageNumber={currentPage}
                pageSize={pageSize}
                totalPages={totalPages}
              />
            </div>
          )}
        </div>
      </div>

      {/* Add structured data for SEO */}
      <WebsiteStructuredData pageType="categories" categoryName={`${secondaryCategory.name} ${primaryCategory.name}`} />
    </div>
  );
} 
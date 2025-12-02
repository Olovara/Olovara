import { ProductFilters } from "@/components/ProductFilters";
import ProductCard from "@/components/ProductCard";
import { db } from "@/lib/db";
import { Metadata } from "next";
import {
  PaginationControlsAndSizeSelector,
  PaginationInfoAndSizeSelector,
} from "@/components/PaginationComponent";
import { Prisma } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Filter } from "lucide-react";
import { getUserCountryCode } from "@/actions/locationFilterActions";
import {
  createProductFilterWhereClause,
  getProductFilterConfig,
  debugProductQuery,
} from "@/lib/product-filtering";
import { LocationFilterInfo } from "@/components/LocationFilterNotice";
import { WebsiteStructuredData } from "@/components/WebsiteStructuredData";
import { auth } from "@/auth";
import { getFollowedSellersFeed } from "@/actions/followActions";
import { SearchAnalyticsTracker } from "@/components/SearchAnalyticsTracker";

export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const categories = searchParams.category?.split(",") || [];
  const secondaryCategories = searchParams.secondaryCategory?.split(",") || [];
  const tertiaryCategories = searchParams.tertiaryCategory?.split(",") || [];
  const priceRange = searchParams.priceRange?.split(",").map(Number) || [
    0, 1000,
  ];
  const sortBy = searchParams.sortBy || "relevant";
  const page = searchParams.page || "1";
  const values = searchParams.values?.split(",") || [];
  const q = searchParams.q || "";

  // Build canonical URL
  const canonicalParams = new URLSearchParams();
  if (categories.length > 0)
    canonicalParams.set("category", categories.join(","));
  if (secondaryCategories.length > 0)
    canonicalParams.set("secondaryCategory", secondaryCategories.join(","));
  if (tertiaryCategories.length > 0)
    canonicalParams.set("tertiaryCategory", tertiaryCategories.join(","));
  if (priceRange[0] !== 0 || priceRange[1] !== 1000)
    canonicalParams.set("priceRange", priceRange.join(","));
  if (sortBy !== "relevant") canonicalParams.set("sortBy", sortBy);
  if (page !== "1") canonicalParams.set("page", page);
  if (values.length > 0) canonicalParams.set("values", values.join(","));
  if (q) canonicalParams.set("q", q);

  const canonicalUrl = canonicalParams.toString()
    ? `/products?${canonicalParams.toString()}`
    : "/products";

  // Generate dynamic title and description based on filters
  let title = "Handmade Products | Yarnnu - Unique Artisan Goods";
  let description =
    "Browse our collection of unique handcrafted products from talented artisans. Find crochet patterns, handmade jewelry, home decor, accessories, and more. Support independent creators and discover one-of-a-kind treasures.";

  if (q) {
    title = `Search Results for "${q}" | Handmade Products | Yarnnu`;
    description = `Search results for "${q}" - Find unique handmade products from talented artisans on Yarnnu.`;
  } else if (categories.length > 0) {
    const categoryLabels = categories
      .map((cat) => cat.charAt(0).toUpperCase() + cat.slice(1))
      .join(", ");
    title = `${categoryLabels} Products | Handmade Goods | Yarnnu`;
    description = `Discover unique ${categoryLabels.toLowerCase()} handmade products from talented artisans. Find one-of-a-kind items crafted with care and attention to detail.`;
  }

  return {
    title,
    description,
    keywords: [
      "handmade products",
      "artisan crafts",
      "crochet patterns",
      "handmade jewelry",
      "unique gifts",
      "handmade home decor",
      "artisan marketplace",
      "handmade accessories",
      "support small business",
      ...categories.map((cat) => `${cat} products`),
      ...values.map(
        (v) => `${v.replace(/([A-Z])/g, " $1").toLowerCase()} products`
      ),
    ],
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

interface ProductsPageProps {
  searchParams: {
    category?: string;
    secondaryCategory?: string;
    tertiaryCategory?: string;
    priceRange?: string;
    sortBy?: string;
    page?: string;
    size?: string;
    values?: string;
    q?: string;
    followedSellers?: string;
  };
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  // Get user's country code for location-based filtering
  const userCountryCode = await getUserCountryCode();

  // Get centralized filter configuration
  const filterConfig = await getProductFilterConfig(
    userCountryCode || undefined
  );

  // Get user session for followed sellers filter
  const session = await auth();

  // Parse filters
  const categories = searchParams.category?.split(",") || [];
  const secondaryCategories = searchParams.secondaryCategory?.split(",") || [];
  const tertiaryCategories = searchParams.tertiaryCategory?.split(",") || [];
  const priceRange = searchParams.priceRange?.split(",").map(Number) || [
    0, 1000,
  ];
  const sortBy = searchParams.sortBy || "relevant";
  const currentPage = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.size) || 24;
  const values = searchParams.values?.split(",") || [];
  const followedSellers = searchParams.followedSellers === "true";

  // Build additional filters
  const additionalFilters: Prisma.ProductWhereInput = {
    AND: [
      {
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
      ...(categories.length > 0
        ? [
            {
              primaryCategory: {
                in: categories,
              },
            },
          ]
        : []),
      ...(secondaryCategories.length > 0
        ? [
            {
              secondaryCategory: {
                in: secondaryCategories,
              },
            },
          ]
        : []),
      ...(tertiaryCategories.length > 0
        ? [
            {
              tertiaryCategory: {
                in: tertiaryCategories,
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
    const followedProducts = await getFollowedSellersFeed(1000); // Get a large number to filter from
    const followedProductIds = followedProducts.map((p) => p.id);

    // Apply additional filters to followed products
    const where = await createProductFilterWhereClause(
      additionalFilters,
      filterConfig
    );
    const allFilteredProducts = await debugProductQuery(where);

    // Filter to only include followed products
    productsWithActiveSellers = allFilteredProducts.filter((product) =>
      followedProductIds.includes(product.id)
    );
  } else {
    // Use centralized filtering for all products
    const where = await createProductFilterWhereClause(
      additionalFilters,
      filterConfig
    );
    productsWithActiveSellers = await debugProductQuery(where);
  }

  // Build orderBy clause
  const orderBy = (() => {
    switch (sortBy) {
      case "relevant":
        // Check if any filters are applied or search is used
        const hasFilters =
          categories.length > 0 ||
          secondaryCategories.length > 0 ||
          tertiaryCategories.length > 0 ||
          values.length > 0 ||
          followedSellers ||
          searchParams.q ||
          priceRange[0] !== 0 ||
          priceRange[1] !== 1000;

        if (hasFilters) {
          // If filters are applied, sort by newest (most relevant)
          return { createdAt: Prisma.SortOrder.desc };
        } else {
          // If no filters, return random order
          return undefined; // This will be handled in the query
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

  // Get total count for pagination (use the filtered count)
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
          isWomanOwned: true,
          isMinorityOwned: true,
          isLGBTQOwned: true,
          isVeteranOwned: true,
          isSustainable: true,
          isCharitable: true,
          excludedCountries: true,
        },
      },
    },
  });

  // Merge the seller information from the debug query with the full product data
  const productsWithSellerInfo = allProducts.map((product) => {
    const debugProduct = productsWithActiveSellers.find(
      (p) => p.id === product.id
    );
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
    // Shuffle the array for random order
    for (let i = filteredProducts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filteredProducts[i], filteredProducts[j]] = [
        filteredProducts[j],
        filteredProducts[i],
      ];
    }
  }

  const products = filteredProducts.slice(0, pageSize);

  // Determine search context
  const searchContext = searchParams.q 
    ? "global search bar" 
    : categories.length > 0 
    ? "category-page" 
    : "homepage";

  return (
    <div className="container mx-auto px-4 py-8 max-w-[2000px]">
      {/* Search Analytics Tracker - tracks searches when query parameter is present */}
      {searchParams.q && (
        <SearchAnalyticsTracker 
          resultCount={totalProducts}
          searchContext={searchContext}
        />
      )}
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
            <ProductFilters />
          </div>
        </div>

        {/* Products Grid */}
        <div className="w-full lg:w-4/5">
          {/* Location Filter Info */}
          <LocationFilterInfo />

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
                <h2 className="text-2xl font-semibold mb-4">
                  Discover Unique Handmade Products
                </h2>
                <p className="text-gray-600 mb-6">
                  We&apos;re constantly adding new products from talented
                  artisans around the world. Try adjusting your filters or check
                  back soon to find amazing handmade items.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2">Artisan Quality</h3>
                    <p>
                      Every product is handcrafted with care and attention to
                      detail
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2">Unique Designs</h3>
                    <p>
                      Find one-of-a-kind pieces that reflect the creator&apos;s
                      vision
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2">Support Creators</h3>
                    <p>
                      Your purchase directly supports independent artisans and
                      their craft
                    </p>
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
      <WebsiteStructuredData pageType="products" />
    </div>
  );
}

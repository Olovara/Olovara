import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { Metadata } from "next";
import { ShopCard } from "@/components/ShopCard";
import {
  PaginationControlsAndSizeSelector,
  PaginationInfoAndSizeSelector,
} from "@/components/PaginationComponent";
import { ShopFilters } from "@/components/ShopFilters";
import { getUserCountryCode } from "@/actions/locationFilterActions";
import {
  createProductFilterWhereClause,
  getProductFilterConfig,
} from "@/lib/product-filtering";
import { WebsiteStructuredData } from "@/components/WebsiteStructuredData";

// Force dynamic rendering - this page uses getUserCountryCode() which uses headers()
export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: ShopsPageProps): Promise<Metadata> {
  const values = searchParams.values?.split(",") || [];
  const sortBy = searchParams.sortBy || "newest";
  const page = searchParams.page || "1";

  // Build canonical URL
  const canonicalParams = new URLSearchParams();
  if (values.length > 0) canonicalParams.set("values", values.join(","));
  if (sortBy !== "newest") canonicalParams.set("sortBy", sortBy);
  if (page !== "1") canonicalParams.set("page", page);
  const countryParam = searchParams.country;
  if (countryParam) canonicalParams.set("country", countryParam);

  const canonicalUrl = canonicalParams.toString()
    ? `/shops?${canonicalParams.toString()}`
    : "/shops";

  // Generate dynamic title and description based on filters
  let title = "Handmade Shops | Yarnnu - Discover Artisan Marketplaces";
  let description =
    "Browse our curated collection of handcrafted shops from talented artisans worldwide. Find woman-owned, minority-owned, LGBTQ+ owned, veteran-owned, sustainable, and charitable businesses. Support independent creators and discover unique handmade products.";

  if (values.length > 0) {
    const valueLabels = {
      isWomanOwned: "Woman-Owned",
      isMinorityOwned: "Minority-Owned",
      isLGBTQOwned: "LGBTQ+ Owned",
      isVeteranOwned: "Veteran-Owned",
      isSustainable: "Sustainable",
      isCharitable: "Charitable",
    };

    const filterLabels = values
      .map((v) => valueLabels[v as keyof typeof valueLabels])
      .join(", ");
    title = `${filterLabels} Handmade Shops | Yarnnu - Support Diverse Artisans`;
    description = `Discover ${filterLabels.toLowerCase()} handmade shops and support diverse artisans on Yarnnu. Find unique handcrafted products from talented creators who align with your values.`;
  }

  return {
    title,
    description,
    keywords: [
      "handmade shops",
      "artisan marketplaces",
      "woman-owned businesses",
      "minority-owned businesses",
      "LGBTQ+ owned businesses",
      "veteran-owned businesses",
      "sustainable businesses",
      "charitable businesses",
      "handmade marketplace",
      "independent creators",
      "artisan shops",
      ...values.map(
        (v) => `${v.replace(/([A-Z])/g, " $1").toLowerCase()} shops`
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

import { validShopValueIds } from "@/data/shop-values";

interface ShopsPageProps {
  searchParams: {
    values?: string;
    sortBy?: string;
    page?: string;
    size?: string;
    country?: string;
  };
}

export default async function ShopsPage({ searchParams }: ShopsPageProps) {
  // Get user's country code for location-based filtering
  const userCountryCode = await getUserCountryCode();
  // Get centralized filter configuration
  const filterConfig = await getProductFilterConfig(
    userCountryCode || undefined
  );
  const productWhere = await createProductFilterWhereClause({}, filterConfig);

  const values = searchParams.values?.split(",") || [];
  const sortBy = searchParams.sortBy || "newest";
  const currentPage = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.size) || 24;
  const countries = searchParams.country?.split(",").filter(Boolean) || [];

  // Filter out invalid values
  const validValues = values.filter((value) =>
    validShopValueIds.includes(value as (typeof validShopValueIds)[number])
  );

  // Build where clause
  const where = {
    AND: [
      {
        applicationAccepted: true, // Only show accepted sellers
      },
      {
        // Exclude temporary shops that haven't been set up yet
        NOT: {
          shopName: {
            contains: "Temporary Shop",
          },
        },
      },
      ...(validValues.length > 0
        ? [
            {
              shopValues: {
                hasEvery: validValues, // Seller must have all selected values
              },
            },
          ]
        : []),
      ...(countries.length > 0
        ? [
            {
              shopCountry: { in: countries },
            },
          ]
        : []),
    ],
  };

  // Build orderBy clause
  const orderBy = (() => {
    switch (sortBy) {
      case "sales":
        return { totalSales: Prisma.SortOrder.desc };
      case "products":
        return { totalProducts: Prisma.SortOrder.desc };
      case "name-asc":
        return { shopName: Prisma.SortOrder.asc };
      case "name-desc":
        return { shopName: Prisma.SortOrder.desc };
      case "oldest":
        return { createdAt: Prisma.SortOrder.asc };
      default:
        return { createdAt: Prisma.SortOrder.desc };
    }
  })();

  // Get total count for pagination
  const totalShops = await db.seller.count({ where });
  const totalPages = Math.ceil(totalShops / pageSize);

  // Fetch shops with pagination
  const shops = await db.seller.findMany({
    where,
    orderBy,
    take: pageSize,
    skip: (currentPage - 1) * pageSize,
    select: {
      id: true,
      shopName: true,
      shopNameSlug: true,
      shopTagLine: true,
      totalSales: true,
      totalProducts: true,
      followerCount: true,
      acceptsCustom: true,
      // Social media links
      facebookUrl: true,
      instagramUrl: true,
      pinterestUrl: true,
      tiktokUrl: true,
      products: {
        where: productWhere,
        select: {
          id: true,
        },
      },
    },
  });

  // Transform the data to include the total product count and sort case-insensitively if needed
  const shopsWithCount = shops.map((shop) => ({
    ...shop,
    totalProducts: shop.products.length,
  }));

  // Apply case-insensitive sorting if needed
  if (sortBy === "name-asc" || sortBy === "name-desc") {
    shopsWithCount.sort((a, b) => {
      const nameA = a.shopName.toLowerCase();
      const nameB = b.shopName.toLowerCase();
      return sortBy === "name-asc"
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    });
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-[2000px]">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="w-full lg:w-1/5">
          <div className="sticky top-4">
            <ShopFilters />
          </div>
        </div>

        {/* Shops Grid */}
        <div className="w-full lg:w-4/5">
          {/* Pagination Info - always show so user can change page size */}
          <div className="mb-6">
            <PaginationInfoAndSizeSelector
              totalCount={totalShops}
              pageNumber={currentPage}
              pageSize={pageSize}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {shopsWithCount.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>

          {shops.length === 0 && (
            <div className="text-center py-12">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-semibold mb-4">
                  Discover Amazing Artisan Shops
                </h2>
                <p className="text-gray-600 mb-6">
                  We&apos;re constantly adding new talented artisans to our
                  marketplace. Check back soon to discover unique handmade
                  products from creators around the world.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2">Woman-Owned Businesses</h3>
                    <p>
                      Support female entrepreneurs and their creative ventures
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2">Sustainable Practices</h3>
                    <p>Find eco-friendly products and responsible creators</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2">Unique Handmade Items</h3>
                    <p>
                      Discover one-of-a-kind pieces you won&apos;t find
                      elsewhere
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pagination Controls - always show so user can change page size */}
          <div className="mt-8">
            <PaginationControlsAndSizeSelector
              totalCount={totalShops}
              pageNumber={currentPage}
              pageSize={pageSize}
              totalPages={totalPages}
            />
          </div>
        </div>
      </div>

      {/* Add structured data for SEO */}
      <WebsiteStructuredData pageType="shops" />
    </div>
  );
}

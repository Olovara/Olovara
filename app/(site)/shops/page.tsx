import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { Metadata } from "next";
import { ShopCard } from "@/components/ShopCard";
import {
  PaginationControlsAndSizeSelector,
  PaginationInfoAndSizeSelector,
} from "@/components/PaginationComponent";
import { ShopFilters } from "@/components/ShopFilters";

export const metadata: Metadata = {
  title: "Shops | Yarnnu",
  description: "Browse our collection of handcrafted shops",
};

// Define valid filter values
const validFilterValues = [
  "isWomanOwned",
  "isMinorityOwned",
  "isLGBTQOwned",
  "isVeteranOwned",
  "isSustainable",
  "isCharitable",
] as const;

interface ShopsPageProps {
  searchParams: {
    values?: string;
    sortBy?: string;
    page?: string;
    size?: string;
  };
}

export default async function ShopsPage({ searchParams }: ShopsPageProps) {
  const values = searchParams.values?.split(",") || [];
  const sortBy = searchParams.sortBy || "newest";
  const currentPage = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.size) || 24;

  // Filter out invalid values
  const validValues = values.filter(value => validFilterValues.includes(value as typeof validFilterValues[number]));

  // Build where clause
  const where = {
    AND: [
      {
        applicationAccepted: true, // Only show accepted sellers
      },
      ...(validValues.length > 0
        ? validValues.map((value) => ({
            [value]: true,
          }))
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
    include: {
      products: {
        where: {
          status: "ACTIVE",
        },
        select: {
          id: true,
        },
      },
    },
  });

  // Transform the data to include the total product count and sort case-insensitively if needed
  const shopsWithCount = shops.map(shop => ({
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
          {/* Pagination Info */}
          {totalPages > 1 && (
            <div className="mb-6">
              <PaginationInfoAndSizeSelector
                totalCount={totalShops}
                pageNumber={currentPage}
                pageSize={pageSize}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {shopsWithCount.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>

          {shops.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No shops found matching your filters.</p>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8">
              <PaginationControlsAndSizeSelector
                totalCount={totalShops}
                pageNumber={currentPage}
                pageSize={pageSize}
                totalPages={totalPages}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
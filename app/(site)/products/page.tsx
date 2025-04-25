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

export const metadata: Metadata = {
  title: "Products | Yarnnu",
  description: "Browse our collection of handcrafted products",
};

interface ProductsPageProps {
  searchParams: {
    category?: string;
    priceRange?: string;
    sortBy?: string;
    page?: string;
    size?: string;
    values?: string;
    q?: string;
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  // Parse filters
  const categories = searchParams.category?.split(",") || [];
  const priceRange = searchParams.priceRange?.split(",").map(Number) || [0, 1000];
  const sortBy = searchParams.sortBy || "newest";
  const currentPage = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.size) || 24;
  const values = searchParams.values?.split(",") || [];

  // Build where clause
  const where: Prisma.ProductWhereInput = {
    AND: [
      {
        price: {
          gte: priceRange[0],
          lte: priceRange[1],
        },
      },
      {
        status: "ACTIVE", // Only show active products
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

  // Build orderBy clause
  const orderBy = (() => {
    switch (sortBy) {
      case "price-asc":
        return { price: Prisma.SortOrder.asc };
      case "price-desc":
        return { price: Prisma.SortOrder.desc };
      case "popular":
        return { numberSold: Prisma.SortOrder.desc };
      default:
        return { createdAt: Prisma.SortOrder.desc };
    }
  })();

  // Get total count for pagination
  const totalProducts = await db.product.count({ where });
  const totalPages = Math.ceil(totalProducts / pageSize);

  // Fetch products with pagination
  const products = await db.product.findMany({
    where,
    orderBy,
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
    include: {
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
        },
      },
    },
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-[2000px]">
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
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No products found matching your filters.</p>
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
    </div>
  );
}

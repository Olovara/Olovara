import {
  PaginationControlsAndSizeSelector,
  PaginationInfoAndSizeSelector,
} from "@/components/PaginationComponent";
import ProductCard from "@/components/ProductCard";
import Filters from "@/components/ProductFilters";
import { db } from "@/lib/db";
import React from "react";

interface SearchParams {
  category?: string;
  priceRange?: string;
  orderBy?: string;
  pageSize?: string;
  pageNumber?: string;
}

interface ProductListing {
  id: string;
  name: string;
  price: number;
  images: string[];
  primaryCategory: string;
  secondaryCategory: string;
  isDigital: boolean;
  freeShipping: boolean;
  onSale: boolean;
  discount: number | null;
  numberSold: number;
  seller: {
    shopName: string;
    shopNameSlug: string;
  } | null;
}

export default async function Products({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Parse search params
  const categories = searchParams.category?.split(",") || [];
  const priceRange = searchParams.priceRange?.split(",").map(Number) || [5, 1000];
  const orderBy = searchParams.orderBy || "updatedAt_desc";
  const pageSize = Math.min(Number(searchParams.pageSize) || 12, 24); // Cap page size
  const pageNumber = Number(searchParams.pageNumber) || 1;

  // Calculate skip for pagination
  const skip = (pageNumber - 1) * pageSize;

  // Build where clause for filtering
  const where = {
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
      ...(categories.length > 0
        ? [
            {
              primaryCategory: {
                in: categories,
              },
            },
          ]
        : []),
    ],
  };

  // Parse orderBy value correctly
  const [field, dir] = orderBy.split("_");
  const direction = dir?.toLowerCase() === "asc" ? "asc" : "desc";

  // Fallback to a valid field if the field is invalid
  const validFields = ["price", "name", "createdAt", "updatedAt", "numberSold"];
  const safeField = validFields.includes(field) ? field : "updatedAt";

  const orderByClause = {
    [safeField]: direction,
  };

  // Fetch products with minimal data first
  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        price: true,
        images: true,
        primaryCategory: true,
        secondaryCategory: true,
        isDigital: true,
        freeShipping: true,
        onSale: true,
        discount: true,
        numberSold: true,
        seller: {
          select: {
            shopName: true,
            shopNameSlug: true,
          },
        },
      },
      orderBy: orderByClause,
      skip,
      take: pageSize,
    }),
    db.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters */}
        <div className="w-full md:w-1/4">
          <Filters />
        </div>

        {/* Products Grid */}
        <div className="w-full md:w-3/4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product: ProductListing, index: number) => (
              <ProductCard key={product.id} product={product as any} index={index} />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-8">
            <PaginationInfoAndSizeSelector
              totalCount={total}
              pageSize={pageSize}
              pageNumber={pageNumber}
            />
            <PaginationControlsAndSizeSelector
              totalCount={total}
              totalPages={totalPages}
              pageSize={pageSize}
              pageNumber={pageNumber}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

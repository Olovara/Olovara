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

export default async function Products({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Parse search params
  const categories = searchParams.category?.split(",") || [];
  const priceRange = searchParams.priceRange?.split(",").map(Number) || [
    5, 1000,
  ];
  const orderBy = searchParams.orderBy || "updatedAt_desc";
  const pageSize = Number(searchParams.pageSize) || 12;
  const pageNumber = Number(searchParams.pageNumber) || 1;

  // Calculate skip for pagination
  const skip = (pageNumber - 1) * pageSize;

  // Build where clause
  const where = {
    AND: [
      {
        price: {
          gte: priceRange[0],
          lte: priceRange[1],
        },
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
  const direction =
    dir?.toLowerCase() === "asc" || dir?.toLowerCase() === "desc"
      ? dir.toLowerCase()
      : "desc";

  // Fallback to a valid field if the field is invalid
  const validFields = ["price", "name", "createdAt", "updatedAt", "numberSold"]; // add whatever you support
  const safeField = validFields.includes(field) ? field : "updatedAt";

  const orderByClause = {
    [safeField]: direction,
  };

  // Fetch products with filters and pagination
  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      select: {
        price: true,
        name: true,
        description: true,
        id: true,
        images: true,
        primaryCategory: true,
        isDigital: true,
        status: true,
      },
      orderBy: orderByClause,
      skip,
      take: pageSize,
    }),
    db.product.count({ where }),
  ]);

  return (
    <div className="container mx-auto p-5">
      <h1 className="text-2xl font-bold mb-4">Marketplace Products</h1>
      <Filters />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.length > 0 ? (
          products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">
            No products available.
          </p>
        )}
      </div>
    </div>
  );
}

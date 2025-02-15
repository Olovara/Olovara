import ProductCard from "@/components/ProductCard";
import Filters from "@/components/ProductFilters";
import { db } from "@/lib/db";
import React from "react";

export default async function Products() {
  // Fetch products directly from the database
  const products = await db.product.findMany({
    select: {
      price: true,
      name: true,
      description: true,
      id: true,
      images: true,
      primaryCategory: true, // Make sure to fetch primaryCategory if needed for your card
    },
  });

  return (
    <div className="container mx-auto p-5">
      <h1 className="text-2xl font-bold mb-4">Marketplace Products</h1>
      {/* Sidebar */}
      <Filters />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.length > 0 ? (
          products.map((product, index) => (
            // Pass product and index to the ProductCard
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

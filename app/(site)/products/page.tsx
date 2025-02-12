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
    },
  });

  return (
    <div className="container mx-auto p-5">
      <h1 className="text-2xl font-bold mb-4">Marketplace Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="border p-4 rounded-lg shadow-md">
              <img
                src={product.images?.[0] || "/placeholder.jpg"}
                alt={product.name}
                className="w-full h-48 object-cover rounded-md"
              />
              <h2 className="text-lg font-semibold mt-2">{product.name}</h2>
              <p className="text-gray-600">${product.price.toFixed(2)}</p>
            </div>
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

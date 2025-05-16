import React from "react";
import { db } from "@/lib/db";
import Image from "next/image";
import ContactSellerButton from "@/components/shared/ContactSellerButton";
import ProductCard from "@/components/ProductCard";

interface ShopPageProps {
  params: { shopNameSlug: string };
}

// Fetch seller and products
async function getShopData(shopNameSlug: string) {
  const seller = await db.seller.findUnique({
    where: { shopNameSlug }, // Fetch using the slug
    include: { 
      products: {
        where: {
          status: "ACTIVE" // Only include active products
        },
        select: {
          id: true,
          name: true,
          price: true,
          currency: true,
          images: true,
          primaryCategory: true,
          secondaryCategory: true,
          status: true,
          isDigital: true,
          onSale: true,
          discount: true,
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
            },
          },
        }
      }
    },
  });

  return seller;
}

export default async function ShopPage({ params }: ShopPageProps) {
  const seller = await getShopData(params.shopNameSlug);

  if (!seller) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-semibold text-gray-500">Shop not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-8 text-center">
        <h1 className="text-4xl font-bold">{seller.shopName}</h1>
        {seller.shopTagLine && (
          <p className="text-gray-600 mt-2">{seller.shopTagLine}</p>
        )}
        {seller.shopDescription && (
          <p className="text-sm text-gray-500 mt-2">{seller.shopDescription}</p>
        )}
        <div className="mt-4 max-w-xs mx-auto">
          <ContactSellerButton 
            sellerId={seller.id} 
            sellerName={seller.shopName} 
          />
        </div>
      </section>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="col-span-3 border-r pr-6">
          <h2 className="text-lg font-semibold mb-4">Shop Information</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>All Products ({seller.products.length})</li>
            <li>
              Physical Items (
              {seller.products.filter((p) => !p.isDigital).length})
            </li>
            <li>
              Digital Products (
              {seller.products.filter((p) => p.isDigital).length})
            </li>
          </ul>

          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">About the Seller</h2>
            <p className="text-sm text-gray-600">
              Total Sales: {seller.totalSales}
            </p>
            {seller.acceptsCustom && (
              <p className="text-sm text-green-600 mt-2">
                Accepts Custom Orders
              </p>
            )}
          </div>
        </aside>

        {/* Product Grid */}
        <section className="col-span-9">
          <h2 className="text-lg font-semibold mb-4">Products</h2>
          {seller.products.length === 0 ? (
            <p className="text-gray-500">No products available.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {seller.products.map((product, index) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  index={index} 
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useCurrency } from "@/hooks/useCurrency";
import ProductActions from "@/components/ProductPageActions";

// Dynamically import the ImageSlider component
const ImageSlider = dynamic(() => import("@/components/ImageSlider"), {
  ssr: false,
});

const ProtectedProductDescription = dynamic(
  () => import("@/components/ProtectedProductDescription"),
  { ssr: false }
);

interface ProductDetailsProps {
  data: {
    id: string;
    name: string;
    images: string[];
    price: number;
    currency: string;
    discount: number | null;
    discountEndDate: Date | null;
    description: any;
    status: string;
    isDigital: boolean;
    stock: number;
    productFile: string | null;
    handlingFee: number | null;
    shippingCost: number | null;
    itemWeight: number | null;
    itemWeightUnit: string | null;
    itemLength: number | null;
    itemWidth: number | null;
    itemHeight: number | null;
    itemDimensionUnit: string | null;
    shippingNotes: string | null;
    freeShipping: boolean;
    inStockProcessingTime: number | null;
    howItsMade: string | null;
    tags: string[];
    NSFW: boolean;
    seller: {
      shopName: string;
      shopNameSlug: string;
    } | null;
    dropDate: Date | null;
    dropTime: string | null;
  };
}

export default function ProductDetails({ data }: ProductDetailsProps) {
  const [convertedPrice, setConvertedPrice] = useState<string>("");
  const [convertedFinalPrice, setConvertedFinalPrice] = useState<string>("");
  const [convertedShippingCost, setConvertedShippingCost] = useState<string>("");
  const { formatPrice } = useCurrency();

  useEffect(() => {
    // Convert regular price
    formatPrice(data.price, true)
      .then(setConvertedPrice)
      .catch(console.error);

    // Calculate and convert final price (with discount if applicable)
    const finalPrice = data.discount
      ? data.price - (data.price * data.discount) / 100
      : data.price;

    formatPrice(finalPrice, true)
      .then(setConvertedFinalPrice)
      .catch(console.error);

    // Convert shipping cost if it exists
    if (data.shippingCost || data.handlingFee) {
      const totalShipping = (data.shippingCost || 0) + (data.handlingFee || 0);
      formatPrice(totalShipping, true)
        .then(setConvertedShippingCost)
        .catch(console.error);
    }
  }, [data.price, data.discount, data.shippingCost, data.handlingFee, formatPrice]);

  const isOnSale = data.discount && data.discountEndDate && new Date(data.discountEndDate) > new Date();

  return (
    <section className="mx-auto px-4 lg:mt-10 max-w-7xl lg:px-8">
      {/* Product Image and Name Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-1 lg:col-span-2 w-full h-full bg-gray-100 rounded-lg overflow-hidden">
          <ImageSlider urls={data.images} />
        </div>

        <div className="col-span-1 flex flex-col justify-center space-y-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            {data.name}
          </h1>
          {data.seller?.shopName && (
            <p className="text-gray-700 text-sm">
              Made by:&nbsp;
              <Link
                href={`/shops/${data.seller.shopNameSlug}`}
                className="font-medium text-purple-600 hover:underline"
              >
                {data.seller.shopName}
              </Link>
            </p>
          )}
          {!data.isDigital && data.stock > 0 && data.inStockProcessingTime && (
            <div>
              <p className="text-sm text-gray-500">
                Ships in {data.inStockProcessingTime} days.
              </p>
            </div>
          )}

          {/* Sale Price or Regular Price */}
          <p className="text-xl font-semibold text-gray-800">
            {isOnSale ? (
              <>
                <span className="line-through text-gray-500">
                  {convertedPrice}
                </span>{" "}
                <span className="text-red-600">{convertedFinalPrice}</span>
              </>
            ) : (
              convertedPrice
            )}
          </p>

          {/* Combined Shipping and Handling Fee */}
          {!data.freeShipping && (data.shippingCost || data.handlingFee) && (
            <p className="text-sm text-gray-600">
              Shipping & Handling: {convertedShippingCost}
            </p>
          )}
          {data.freeShipping && (
            <p className="text-sm text-green-600">Free Shipping Available</p>
          )}

          {/* Display Stock Quantity if it's a physical product */}
          {!data.isDigital && (
            <p className="text-sm text-gray-600">
              {data.stock > 0
                ? `In Stock: ${data.stock} available`
                : "Out of Stock"}
            </p>
          )}
          {/* Quantity Selector & Buy Now Button */}
          <ProductActions 
            productId={data.id} 
            maxStock={data.stock} 
            dropDate={data.dropDate}
            dropTime={data.dropTime}
            isDigital={data.isDigital}
            price={data.price}
            shippingCost={data.shippingCost || 0}
            handlingFee={data.handlingFee || 0}
            sellerId={data.seller?.shopName ? data.seller.shopName : undefined}
            onSale={Boolean(isOnSale)}
            discount={data.discount}
          />

          {/* How It's Made Section */}
          {data.howItsMade && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">How It&apos;s Made</h3>
              <p className="text-gray-600">{data.howItsMade}</p>
            </div>
          )}

          {/* Shipping Notes Section */}
          {data.shippingNotes && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Shipping Notes</h3>
              <p className="text-gray-600">{data.shippingNotes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="text-gray-700">
          <ProtectedProductDescription
            content={data.description}
            NSFW={Boolean(data.NSFW)}
          />
        </div>

        {/* Shipping and Dimensions */}
        {!data.isDigital && (
          <div className="p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Product Details</h3>
            {data.itemWeight && (
              <p className="text-gray-600">
                Weight: {data.itemWeight} {data.itemWeightUnit}
              </p>
            )}
            {(data.itemLength || data.itemWidth || data.itemHeight) && (
              <p className="text-gray-600">
                Dimensions: {data.itemLength || 0} × {data.itemWidth || 0} × {data.itemHeight || 0} {data.itemDimensionUnit}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Digital Product Download */}
      {data.isDigital && data.productFile && (
        <div className="mt-8 bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Digital Download</h3>
          {/*
            Use the secure download API route to prevent unauthorized access.
            The API will check if the user has a completed, paid order before redirecting to the file.
          */}
          <a
            href={`/api/download/${data.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Download Now
          </a>
        </div>
      )}
    </section>
  );
} 
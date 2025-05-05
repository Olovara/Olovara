"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";
import Link from "next/link";
import { cn, formatPrice } from "@/lib/utils";
import { CategoriesMap } from "@/data/categories";
import ImageSlider from "./ImageSlider";
import { CountdownTimer } from "./CountdownTimer";

interface SimplifiedProduct {
  name: string;
  id: string;
  status: string;
  isDigital: boolean;
  discount: number | null;
  price: number;
  images: string[];
  primaryCategory: string;
  stock: number;
  dropDate: Date | null;
  dropTime: string | null;
  seller?: {
    shopName: string;
    shopNameSlug: string;
    isWomanOwned: boolean;
    isMinorityOwned: boolean;
    isLGBTQOwned: boolean;
    isVeteranOwned: boolean;
    isSustainable: boolean;
    isCharitable: boolean;
  } | null;
}

interface ProductListingProps {
  product: SimplifiedProduct | null;
  index: number;
}

const ProductCard = ({ product, index }: ProductListingProps) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDropActive, setIsDropActive] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * 75);

    return () => clearTimeout(timer);
  }, [index]);

  // Check if drop is active
  useEffect(() => {
    if (product?.dropDate && product?.dropTime) {
      const [hours, minutes] = product.dropTime.split(":").map(Number);
      const dropDateTime = new Date(product.dropDate);
      dropDateTime.setHours(hours, minutes, 0, 0);
      setIsDropActive(dropDateTime.getTime() <= new Date().getTime());

      // Set up interval to check drop status
      const interval = setInterval(() => {
        setIsDropActive(dropDateTime.getTime() <= new Date().getTime());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [product?.dropDate, product?.dropTime]);

  if (!product || !isVisible) return <ProductPlaceholder />;

  const primaryCategories = CategoriesMap.PRIMARY;
  const label = primaryCategories.find(
    ({ id }) => id === product.primaryCategory
  )?.name;

  // Filter out any invalid image URLs
  const validUrls = product.images.filter(Boolean) as string[];
  const imageUrlsToUse = validUrls.length > 0 ? validUrls : ["/placeholder.jpg"];

  const isDropProduct = product.dropDate && product.dropTime;

  return (
    <Link
      className={cn("invisible h-full w-full cursor-pointer group/main", {
        "visible animate-in fade-in-5": isVisible,
      })}
      href={`/product/${product.id}`}
    >
      <div className="flex flex-col w-full">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg">
          <ImageSlider urls={imageUrlsToUse} />
          {isLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
        </div>
        <h3 className="mt-4 font-medium text-sm text-gray-700 line-clamp-2">
          {product.name}
        </h3>
        <p className="mt-1 text-sm text-gray-500">{label}</p>
        {isDropProduct && (
          <div className="mt-1">
            <p className="text-xs text-gray-400">Drops in:</p>
            <CountdownTimer
              dropDate={product.dropDate}
              dropTime={product.dropTime}
              variant="compact"
              className="text-sm text-gray-500"
            />
          </div>
        )}
        <p className="mt-1 font-medium text-sm text-gray-900">
          {formatPrice(product.price, { isCents: true })}
        </p>
      </div>
    </Link>
  );
};

const ProductPlaceholder = () => (
  <div className="flex flex-col w-full">
    <div className="relative aspect-square w-full overflow-hidden rounded-lg">
      <Skeleton className="h-full w-full" />
    </div>
    <Skeleton className="h-4 w-3/4 mt-4" />
    <Skeleton className="h-4 w-1/2 mt-2" />
    <Skeleton className="h-4 w-1/4 mt-2" />
  </div>
);

export default ProductCard;

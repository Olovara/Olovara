"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CategoriesMap } from "@/data/categories";
import ImageSlider from "./ImageSlider";
import { CountdownTimer } from "./CountdownTimer";
import { useCurrency } from "@/hooks/useCurrency";

interface SimplifiedProduct {
  name: string;
  id: string;
  status: string;
  isDigital: boolean;
  discount: number | null;
  price: number;
  currency: string;
  images: string[];
  primaryCategory: string;
  secondaryCategory?: string;
  tertiaryCategory?: string;
  stock: number;
  dropDate: Date | null;
  dropTime: string | null;
  onSale: boolean;
  saleStartDate: Date | null;
  saleEndDate: Date | null;
  saleStartTime: string | null;
  saleEndTime: string | null;
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
  const [convertedPrice, setConvertedPrice] = useState<string>("");
  const [convertedDiscountedPrice, setConvertedDiscountedPrice] =
    useState<string>("");
  const { formatPrice } = useCurrency();

  // Check if sale is currently active
  const isOnSale = (() => {
    if (!product?.onSale || !product?.discount) return false;

    const now = new Date();

    // Check sale start date/time
    if (product.saleStartDate) {
      const saleStart = new Date(product.saleStartDate);
      if (product.saleStartTime) {
        const [hours, minutes] = product.saleStartTime.split(":").map(Number);
        saleStart.setHours(hours, minutes, 0, 0);
      }
      if (now < saleStart) return false;
    }

    // Check sale end date/time
    if (product.saleEndDate) {
      const saleEnd = new Date(product.saleEndDate);
      if (product.saleEndTime) {
        const [hours, minutes] = product.saleEndTime.split(":").map(Number);
        saleEnd.setHours(hours, minutes, 0, 0);
      }
      if (now > saleEnd) return false;
    }

    return true;
  })();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * 75);

    return () => clearTimeout(timer);
  }, [index]);

    // Convert price when product or currency changes
  useEffect(() => {
    if (product) {
      // Format original price
      formatPrice(product.price, true)
        .then(setConvertedPrice)
        .catch(console.error);
      
      // Format discounted price if sale is active
      if (isOnSale && product.discount) {
        const discountedAmount = product.price * (1 - product.discount / 100);
        formatPrice(discountedAmount, true)
          .then(setConvertedDiscountedPrice)
          .catch(console.error);
      } else {
        setConvertedDiscountedPrice("");
      }
    }
  }, [product, formatPrice, isOnSale]);

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
  const secondaryCategories = CategoriesMap.SECONDARY;
  const tertiaryCategories = CategoriesMap.TERTIARY;

  const primaryLabel = primaryCategories.find(
    ({ id }) => id === product.primaryCategory
  )?.name;

  const secondaryLabel = product.secondaryCategory
    ? secondaryCategories.find(({ id }) => id === product.secondaryCategory)
        ?.name
    : null;

  const tertiaryLabel = product.tertiaryCategory
    ? tertiaryCategories.find(({ id }) => id === product.tertiaryCategory)?.name
    : null;

  // Build category display string
  const categoryDisplay = [tertiaryLabel, secondaryLabel, primaryLabel]
    .filter(Boolean)
    .join(" • ");

  // Filter out any invalid image URLs
  const validUrls = product.images.filter(Boolean) as string[];
  const imageUrlsToUse =
    validUrls.length > 0 ? validUrls : ["/placeholder.jpg"];

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

        {/* Product Name - First */}
        <h3 className="mt-4 font-medium text-sm text-gray-700 line-clamp-2">
          {product.name}
        </h3>

        {/* Shop Name - Second */}
        {product.seller?.shopName && (
          <p className="mt-1 text-sm text-gray-500">
            {product.seller.shopName}
          </p>
        )}

        {/* Price - Third with sale indication */}
        <div className="mt-1">
          {isOnSale ? (
            <div className="flex items-center gap-2">
              <span className="line-through text-sm text-gray-400">
                {convertedPrice}
              </span>
              <span className="font-medium text-sm text-green-600">
                {convertedDiscountedPrice}
              </span>
              <span className="text-xs text-green-600 font-medium">
                -{product.discount}%
              </span>
            </div>
          ) : (
            <p className="font-medium text-sm text-gray-900">
              {convertedPrice}
            </p>
          )}
        </div>

        {/* Drop countdown (if applicable) */}
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

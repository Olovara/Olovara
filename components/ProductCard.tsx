"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Categories } from "@/data/categories";
import ImageSlider from "./ImageSlider";
import { CountdownTimer } from "./CountdownTimer";
import { useCurrency } from "@/hooks/useCurrency";
import { Heart } from "lucide-react";
import { Button } from "./ui/button";
import { toggleWishlistItem, getUserWishlists } from "@/actions/wishlistActions";
import { toast } from "sonner";
import { useIsInWishlist, useWishlistLoading, useWishlistSync } from "@/hooks/useWishlistSync";

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
    shopValues: string[];
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
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q");

  // Use the sync system for wishlist state
  const isInWishlist = useIsInWishlist(product?.id || "");
  const isWishlistLoading = useWishlistLoading(product?.id || "");
  const { addToWishlist, removeFromWishlist, setLoadingState } = useWishlistSync();

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
      // Get the product's currency (default to USD if not specified)
      const productCurrency = (product.currency || 'USD').toUpperCase();
      
      // Format original price - pass the product's currency so it converts correctly
      formatPrice(product.price, true, productCurrency)
        .then(setConvertedPrice)
        .catch(console.error);

      // Format discounted price if sale is active
      if (isOnSale && product.discount) {
        const discountedAmount = product.price * (1 - product.discount / 100);
        formatPrice(discountedAmount, true, productCurrency)
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

  // Check if product is in wishlist on component mount
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!product) return;

      try {
        const result = await getUserWishlists();
        if (result.success && result.wishlists) {
          const isInAnyWishlist = result.wishlists.some((wishlist: any) =>
            wishlist.items.some((item: any) => item.productId === product.id)
          );

          // Only update if the state is different from current
          if (isInAnyWishlist !== isInWishlist) {
            if (isInAnyWishlist) {
              addToWishlist(product.id);
            } else {
              removeFromWishlist(product.id);
            }
          }
        }
      } catch (error) {
        console.error("Error checking wishlist status:", error);
      }
    };

    checkWishlistStatus();
  }, [product, addToWishlist, removeFromWishlist, isInWishlist]);

  // Handle adding/removing from wishlist
  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Prevent event bubbling

    if (!product) {
      toast.error("Product not available");
      return;
    }

    // Prevent multiple clicks
    if (isWishlistLoading) return;

    // Optimistic update
    if (isInWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }

    setLoadingState(product.id, true);

    try {
      const result = await toggleWishlistItem({
        productId: product.id,
      });

      if (result.success) {
        toast.success(result.action === "added" ? "Added to wishlist!" : "Removed from wishlist!");
      } else {
        // Revert optimistic update on error
        if (result.action === "added") {
          removeFromWishlist(product.id);
        } else {
          addToWishlist(product.id);
        }
        toast.error(result.error || "Failed to update wishlist");
      }
    } catch (error) {
      // Revert optimistic update on error
      if (isInWishlist) {
        addToWishlist(product.id);
      } else {
        removeFromWishlist(product.id);
      }
      toast.error("Something went wrong");
    } finally {
      setLoadingState(product.id, false);
    }
  };

  if (!product || !isVisible) return <ProductPlaceholder />;

  // Find category labels from the tree structure
  const primaryLabel = Categories.find(
    ({ id }) => id === product.primaryCategory
  )?.name;

  const secondaryLabel = product.secondaryCategory
    ? (() => {
      for (const primary of Categories) {
        const secondary = primary.children.find(({ id }) => id === product.secondaryCategory);
        if (secondary) return secondary.name;
      }
      return null;
    })()
    : null;

  const tertiaryLabel = product.tertiaryCategory
    ? (() => {
      for (const primary of Categories) {
        for (const secondary of primary.children) {
          if ("children" in secondary && secondary.children) {
            const tertiary = secondary.children.find(({ id }) => id === product.tertiaryCategory);
            if (tertiary) return tertiary.name;
          }
        }
      }
      return null;
    })()
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

  // Track product click if this is from a search results page
  const handleProductClick = async () => {
    if (searchQuery && product?.id) {
      try {
        // Get device ID
        const getDeviceId = (): string => {
          const cookies = document.cookie.split(';');
          const deviceCookie = cookies.find(c => c.trim().startsWith('deviceId='));
          if (deviceCookie) return deviceCookie.split('=')[1];
          const stored = localStorage.getItem('deviceId');
          if (stored) return stored;
          return '';
        };

        const deviceId = getDeviceId();
        if (deviceId) {
          // Update search analytics with click data
          await fetch('/api/analytics/search', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clickProductId: product.id,
              deviceId,
              searchQuery: searchQuery.trim(),
            }),
          });
        }
      } catch (error) {
        // Silently fail - don't interrupt user experience
        console.warn('Failed to track product click:', error);
      }
    }
  };

  return (
    <Link
      className={cn("invisible h-full w-full cursor-pointer group/main", {
        "visible animate-in fade-in-5": isVisible,
      })}
      href={`/product/${product.id}`}
      onClick={handleProductClick}
    >
      <div className="flex flex-col w-full">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg">
          <ImageSlider urls={imageUrlsToUse} />
          {isLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}

          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddToWishlist}
            disabled={isWishlistLoading}
            className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full bg-white/80 hover:bg-white shadow-sm opacity-0 group-hover/main:opacity-100 transition-opacity duration-200 z-10"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${isInWishlist
                  ? "fill-purple-600 text-purple-600"
                  : "text-gray-600 hover:text-purple-600"
                }`}
            />
          </Button>
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

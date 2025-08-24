"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Users, Package } from "lucide-react";
import { getFollowedSellersFeed } from "@/actions/followActions";
import { useCurrency } from "@/hooks/useCurrency";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  createdAt: Date;
  seller: {
    id: string;
    shopName: string;
    shopNameSlug: string;
    sellerImage: string | null;
  } | null;
}

interface FollowedSellersFeedProps {
  limit?: number;
  showEmptyState?: boolean;
  className?: string;
}

export default function FollowedSellersFeed({
  limit = 12,
  showEmptyState = true,
  className = "",
}: FollowedSellersFeedProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [formattedPrices, setFormattedPrices] = useState<Record<string, string>>({});
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const loadFeed = async () => {
      try {
        setIsLoading(true);
        const feedProducts = await getFollowedSellersFeed(limit);
        setProducts(feedProducts);
        setHasMore(feedProducts.length === limit);
      } catch (error) {
        console.error("Error loading followed sellers feed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeed();
  }, [limit]);

  // Format prices when products change
  useEffect(() => {
    const formatPrices = async () => {
      const pricePromises = products.map(async (product) => {
        const formattedPrice = await formatPrice(product.price, true);
        return { id: product.id, price: formattedPrice };
      });

      const results = await Promise.all(pricePromises);
      const priceMap = results.reduce((acc, { id, price }) => {
        acc[id] = price;
        return acc;
      }, {} as Record<string, string>);

      setFormattedPrices(priceMap);
    };

    if (products.length > 0) {
      formatPrices();
    }
  }, [products, formatPrice]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}
      >
        {Array.from({ length: limit }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <CardContent className="p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0 && showEmptyState) {
    return (
      <Card className={`text-center p-8 ${className}`}>
        <CardContent>
          <Heart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            No products from followed sellers
          </h3>
          <p className="text-gray-600 mb-4">
            Start following your favorite sellers to see their latest products
            here!
          </p>
          <Button asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <Card
            key={product.id}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            <Link href={`/product/${product.id}`}>
              <div className="relative h-48 bg-gray-100">
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package className="w-8 h-8" />
                  </div>
                )}
                <Badge className="absolute top-2 left-2 bg-black/70 text-white">
                  New
                </Badge>
              </div>
            </Link>

            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {product.seller && (
                  <Link
                    href={`/seller/${product.seller.shopNameSlug}`}
                    className="flex items-center gap-2 hover:underline"
                  >
                    {product.seller.sellerImage ? (
                      <Image
                        src={product.seller.sellerImage}
                        alt={product.seller.shopName}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                        <Users className="w-3 h-3 text-gray-600" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {product.seller.shopName}
                    </span>
                  </Link>
                )}
              </div>

              <Link href={`/product/${product.id}`}>
                <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 hover:text-blue-600">
                  {product.name}
                </h3>
              </Link>

                             <div className="flex items-center justify-between">
                 <span className="font-semibold text-lg">
                   {formattedPrices[product.id] || "..."}
                 </span>
                 <span className="text-xs text-gray-500">
                   {formatDate(product.createdAt)}
                 </span>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasMore && (
        <div className="text-center">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}

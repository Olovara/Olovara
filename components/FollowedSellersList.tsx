"use client";

import { useEffect, useState } from "react";
import { getFollowedSellers } from "@/actions/followActions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Package, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toggleWishlistItem, getUserWishlists } from "@/actions/wishlistActions";
import { toast } from "sonner";

interface FollowedSellersListProps {
  showEmptyState?: boolean;
  className?: string;
  emptyStateMessage?: string;
  emptyStateButtonText?: string;
  emptyStateButtonHref?: string;
}

export default function FollowedSellersList({
  showEmptyState = true,
  className = "",
  emptyStateMessage = "Start following sellers to see them here",
  emptyStateButtonText = "Browse Shops",
  emptyStateButtonHref = "/shops",
}: FollowedSellersListProps) {
  const [followedSellers, setFollowedSellers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [wishlistLoadingStates, setWishlistLoadingStates] = useState<Record<string, boolean>>({});
  const [wishlistStates, setWishlistStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadFollowedSellers = async () => {
      try {
        setIsLoading(true);
        const sellers = await getFollowedSellers();
        setFollowedSellers(sellers);
      } catch (error) {
        console.error("Error loading followed sellers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFollowedSellers();
  }, []);

  // Check wishlist status for all products
  useEffect(() => {
    const checkWishlistStatuses = async () => {
      try {
        const result = await getUserWishlists();
        if (result.success && result.wishlists) {
          const newWishlistStates: Record<string, boolean> = {};
          
          // Check all products from all sellers
          followedSellers.forEach((seller) => {
            if (seller.products) {
              seller.products.forEach((product: any) => {
                const isInAnyWishlist = result.wishlists.some((wishlist: any) =>
                  wishlist.items.some((item: any) => item.productId === product.id)
                );
                newWishlistStates[product.id] = isInAnyWishlist;
              });
            }
          });
          
          setWishlistStates(newWishlistStates);
        }
      } catch (error) {
        console.error("Error checking wishlist statuses:", error);
      }
    };

    if (followedSellers.length > 0) {
      checkWishlistStatuses();
    }
  }, [followedSellers]);

  // Handle adding/removing from wishlist
  const handleAddToWishlist = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Prevent event bubbling
    
    setWishlistLoadingStates(prev => ({ ...prev, [productId]: true }));
    try {
      const result = await toggleWishlistItem({
        productId,
      });
      
      if (result.success) {
        setWishlistStates(prev => ({ ...prev, [productId]: result.action === "added" }));
        toast.success(result.action === "added" ? "Added to wishlist!" : "Removed from wishlist!");
      } else {
        toast.error(result.error || "Failed to update wishlist");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setWishlistLoadingStates(prev => ({ ...prev, [productId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-15 h-15 rounded-full bg-muted animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-6 bg-muted rounded animate-pulse w-32" />
                    <div className="h-4 bg-muted rounded animate-pulse w-48" />
                  </div>
                </div>
                <div className="h-8 bg-muted rounded animate-pulse w-20" />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (followedSellers.length === 0 && showEmptyState) {
    return (
      <Card className={`${className}`}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Heart className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            No Followed Sellers Yet
          </h3>
          <p className="text-muted-foreground text-center mb-4">
            {emptyStateMessage}
          </p>
          <Button asChild>
            <Link href={emptyStateButtonHref}>{emptyStateButtonText}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {followedSellers.map((seller) => (
        <Card key={seller.id} className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                {seller.sellerImage ? (
                  <Image
                    src={seller.sellerImage}
                    alt={seller.shopName}
                    width={60}
                    height={60}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-15 h-15 rounded-full bg-muted flex items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-xl">{seller.shopName}</CardTitle>
                  {seller.shopTagLine && (
                    <CardDescription className="mt-1">
                      {seller.shopTagLine}
                    </CardDescription>
                  )}
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {seller.followerCount} followers
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {seller.totalProducts} products
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link href={`/seller/${seller.shopNameSlug}`}>View Shop</Link>
              </Button>
            </div>
          </CardHeader>

          {seller.products && seller.products.length > 0 && (
            <>
              <Separator />
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-4">Recent Products</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {seller.products.map((product: any) => (
                    <div key={product.id} className="group block">
                      <Link href={`/product/${product.id}`}>
                        <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                          {product.images && product.images.length > 0 ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          
                          {/* Wishlist Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleAddToWishlist(e, product.id)}
                            disabled={wishlistLoadingStates[product.id]}
                            className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full bg-white/80 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                          >
                            <Heart 
                              className={`h-4 w-4 transition-colors ${
                                wishlistStates[product.id] 
                                  ? "fill-purple-600 text-purple-600" 
                                  : "text-gray-600 hover:text-purple-600"
                              }`} 
                            />
                          </Button>
                        </div>
                      </Link>
                      <div className="mt-2">
                        <Link href={`/product/${product.id}`}>
                          <h5 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                            {product.name}
                          </h5>
                        </Link>
                        <p className="text-sm font-semibold text-primary">
                          ${(product.price / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {seller.totalProducts > 3 && (
                  <div className="mt-4 text-center">
                    <Button variant="ghost" asChild>
                      <Link href={`/seller/${seller.shopNameSlug}`}>
                        View all {seller.totalProducts} products
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      ))}
    </div>
  );
}

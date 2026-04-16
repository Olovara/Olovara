"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, ShoppingCart, ExternalLink, Check, Heart } from "lucide-react";
import {
  removeFromWishlist,
  markItemAsPurchased,
} from "@/actions/wishlistActions";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { productPublicPathFromFields } from "@/lib/product-public-path";

interface WishlistItemCardProps {
  item: any;
  wishlist?: any;
  wishlistId?: string;
  onUpdate?: () => void;
  compact?: boolean;
}

export function WishlistItemCard({
  item,
  wishlist,
  wishlistId,
  onUpdate,
  compact = false,
}: WishlistItemCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      const result = await removeFromWishlist({
        productId: item.productId,
        wishlistId: wishlist.id,
      });

      if (result.success) {
        toast.success("Removed from wishlist");
        onUpdate?.();
      } else {
        toast.error(result.error || "Failed to remove item");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsPurchased = async () => {
    setIsLoading(true);
    try {
      const result = await markItemAsPurchased({
        wishlistItemId: item.id,
      });

      if (result.success) {
        toast.success("Marked as purchased!");
        onUpdate?.();
      } else {
        toast.error(result.error || "Failed to mark as purchased");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(price / 100);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
        <div className="relative w-12 h-12 flex-shrink-0">
          {item.product.images[0] ? (
            <Image
              src={item.product.images[0]}
              alt={item.product.name}
              fill
              className="object-cover rounded"
            />
          ) : (
            <div className="w-full h-full bg-muted rounded flex items-center justify-center">
              <Heart className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <Link
            href={productPublicPathFromFields({
              id: item.productId,
              name: item.product.name,
              urlSlug: item.product.urlSlug,
            })}
            className="text-sm font-medium hover:underline truncate block"
          >
            {item.product.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {formatPrice(item.product.price, item.product.currency)}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {wishlist.allowPurchases && !item.purchased && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAsPurchased}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <ShoppingCart className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isLoading}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Product Image */}
          <div className="relative w-20 h-20 flex-shrink-0">
            {item.product.images[0] ? (
              <Image
                src={item.product.images[0]}
                alt={item.product.name}
                fill
                className="object-cover rounded"
              />
            ) : (
              <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                <Heart className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            {item.purchased && (
              <div className="absolute inset-0 bg-green-500/20 rounded flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <Link
                  href={productPublicPathFromFields({
                    id: item.productId,
                    name: item.product.name,
                    urlSlug: item.product.urlSlug,
                  })}
                  className="font-medium hover:underline truncate block"
                >
                  {item.product.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  by {item.product.seller?.shopName || "Unknown Seller"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-semibold">
                    {formatPrice(item.product.price, item.product.currency)}
                  </span>
                  {item.product.onSale && (
                    <Badge variant="destructive" className="text-xs">
                      Sale
                    </Badge>
                  )}
                  {item.purchased && (
                    <Badge variant="secondary" className="text-xs">
                      Purchased
                    </Badge>
                  )}
                </div>
                {item.notes && (
                  <p className="text-sm text-muted-foreground mt-1 italic">
                    &quot;{item.notes}&quot;
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href={productPublicPathFromFields({
                      id: item.productId,
                      name: item.product.name,
                      urlSlug: item.product.urlSlug,
                    })}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>

                {wishlist.allowPurchases && !item.purchased && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAsPurchased}
                    disabled={isLoading}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  disabled={isLoading}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

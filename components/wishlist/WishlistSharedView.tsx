"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  ShoppingCart,
  ExternalLink,
  User,
  Eye,
  Share2,
  Lock,
  Globe,
} from "lucide-react";
import { markItemAsPurchased } from "@/actions/wishlistActions";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

interface WishlistSharedViewProps {
  wishlist: any;
}

export function WishlistSharedView({ wishlist }: WishlistSharedViewProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleMarkAsPurchased = async (itemId: string) => {
    setIsLoading(itemId);
    try {
      const result = await markItemAsPurchased({
        wishlistItemId: itemId,
      });

      if (result.success) {
        toast.success("Marked as purchased!");
        // Refresh the page to show updated state
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to mark as purchased");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(null);
    }
  };

  const formatPrice = (price: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(price / 100);
  };

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case "PRIVATE":
        return <Lock className="h-4 w-4" />;
      case "PUBLIC":
        return <Globe className="h-4 w-4" />;
      case "SHAREABLE":
        return <Share2 className="h-4 w-4" />;
      default:
        return <Lock className="h-4 w-4" />;
    }
  };

  const getPrivacyLabel = (privacy: string) => {
    switch (privacy) {
      case "PRIVATE":
        return "Private";
      case "PUBLIC":
        return "Public";
      case "SHAREABLE":
        return "Shareable";
      default:
        return "Private";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Heart className="h-8 w-8 text-pink-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {wishlist.name}
            </h1>
          </div>

          {wishlist.description && (
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-4">
              {wishlist.description}
            </p>
          )}

          <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{wishlist.user?.username || "Anonymous"}</span>
            </div>
            <div className="flex items-center gap-1">
              {getPrivacyIcon(wishlist.privacy)}
              <span>{getPrivacyLabel(wishlist.privacy)}</span>
            </div>
            {wishlist.analytics && (
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{wishlist.analytics.totalViews} views</span>
              </div>
            )}
          </div>

          {wishlist.allowPurchases && (
            <div className="mt-4">
              <Badge variant="secondary" className="text-sm">
                Registry Mode - You can purchase items directly from this
                wishlist
              </Badge>
            </div>
          )}
        </div>

        <Separator className="mb-8" />

        {/* Items Grid */}
        {wishlist.items.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Heart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No items yet</h3>
              <p className="text-gray-500">
                This wishlist is empty. Check back later!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.items.map((item: any) => (
              <Card
                key={item.id}
                className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  {/* Product Image */}
                  <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                    {item.product.images[0] ? (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                        <Heart className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    {item.purchased && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Purchased
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="space-y-3">
                    <div>
                      <Link
                        href={`/product/${item.productId}`}
                        className="text-lg font-semibold hover:text-pink-600 transition-colors line-clamp-2"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        by {item.product.seller?.shopName || "Unknown Seller"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-pink-600">
                        {formatPrice(item.product.price, item.product.currency)}
                      </span>
                      <div className="flex items-center gap-2">
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
                    </div>

                    {item.notes && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                          &quot;{item.notes}&quot;
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="flex-1"
                      >
                        <Link href={`/product/${item.productId}`}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Product
                        </Link>
                      </Button>

                      {wishlist.allowPurchases && !item.purchased && (
                        <Button
                          onClick={() => handleMarkAsPurchased(item.id)}
                          disabled={isLoading === item.id}
                          size="sm"
                          className="flex-1"
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {isLoading === item.id
                            ? "Marking..."
                            : "Mark Purchased"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Powered by{" "}
            <Link
              href="/"
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              Yarnnu
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

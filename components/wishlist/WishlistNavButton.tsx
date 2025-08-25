"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import { getUserWishlists } from "@/actions/wishlistActions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function WishlistNavButton() {
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch wishlist data to show total items count
  useEffect(() => {
    const fetchWishlistData = async () => {
      try {
        const result = await getUserWishlists();
        if (result.success && result.wishlists) {
          const total = result.wishlists.reduce((acc, wishlist) => {
            return acc + (wishlist.items?.length || 0);
          }, 0);
          setTotalItems(total);
        }
      } catch (error) {
        console.error("Error fetching wishlist data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlistData();
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-10 w-10 rounded-full hover:bg-purple-50 hover:text-purple-600 transition-colors"
      aria-label="View wishlist"
    >
      <Heart className="h-5 w-5" />

      {/* Badge showing total items */}
      {!isLoading && totalItems > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center min-w-0"
        >
          {totalItems > 99 ? "99+" : totalItems}
        </Badge>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gray-200 animate-pulse" />
      )}
    </Button>
  );
}

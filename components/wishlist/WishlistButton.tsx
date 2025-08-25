"use client";

import { useState } from "react";
import { Heart, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { addToWishlist, getUserWishlists } from "@/actions/wishlistActions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function WishlistButton({
  productId,
  className,
  variant = "outline",
  size = "default",
}: WishlistButtonProps) {
  const [wishlists, setWishlists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Load wishlists when dropdown opens
  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open && wishlists.length === 0) {
      const result = await getUserWishlists();
      if (result.success && result.wishlists) {
        setWishlists(result.wishlists);
      }
    }
  };

  // Add to specific wishlist
  const handleAddToWishlist = async (wishlistId?: string) => {
    setIsLoading(true);
    try {
      const result = await addToWishlist({
        productId,
        wishlistId,
      });

      if (result.success) {
        toast.success("Added to wishlist!");
        setIsOpen(false);
      } else {
        toast.error(result.error || "Failed to add to wishlist");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Quick add to default wishlist
  const handleQuickAdd = async () => {
    setIsLoading(true);
    try {
      const result = await addToWishlist({ productId });
      if (result.success) {
        toast.success("Added to wishlist!");
      } else {
        toast.error(result.error || "Failed to add to wishlist");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn("gap-2", className)}
          disabled={isLoading}
        >
          <Heart className="h-4 w-4" />
          {size !== "icon" && "Add to Wishlist"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleQuickAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Quick Add (Default Wishlist)
        </DropdownMenuItem>
        {wishlists.length > 0 && (
          <>
            <div className="h-px bg-border my-1" />
            {wishlists.map((wishlist) => (
              <DropdownMenuItem
                key={wishlist.id}
                onClick={() => handleAddToWishlist(wishlist.id)}
                className="flex items-center justify-between"
              >
                <span className="truncate">{wishlist.name}</span>
                {wishlist.isDefault && (
                  <span className="text-xs text-muted-foreground">Default</span>
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

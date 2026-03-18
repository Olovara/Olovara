"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Plus, Settings, ChevronDown } from "lucide-react";
import { getUserWishlists } from "@/actions/wishlistActions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { WishlistItemCard } from "./WishlistItemCard";
import { CreateWishlistModal } from "./CreateWishlistModal";
import {
  useWishlistSync,
  useWishlistTotalItems,
  useWishlistItems,
} from "@/hooks/useWishlistSync";

interface Wishlist {
  id: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  items: any[];
}

interface WishlistFlyoutProps {
  userRole?: "SUPER_ADMIN" | "ADMIN" | "SELLER" | "MEMBER";
}

export function WishlistFlyout({ userRole }: WishlistFlyoutProps) {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [selectedWishlistId, setSelectedWishlistId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Use the sync system for total items count and wishlist items
  const totalItems = useWishlistTotalItems();
  const wishlistItemIds = useWishlistItems();
  const { setWishlistItems, setTotalItems } = useWishlistSync();

  // Fetch wishlist data
  useEffect(() => {
    const fetchWishlists = async () => {
      try {
        const result = await getUserWishlists();
        if (result.success && result.wishlists) {
          setWishlists(result.wishlists);

          // Update the global sync state
          const allProductIds: string[] = [];
          let totalCount = 0;

          result.wishlists.forEach((wishlist: any) => {
            if (wishlist.items) {
              wishlist.items.forEach((item: any) => {
                allProductIds.push(item.productId);
                totalCount++;
              });
            }
          });

          setWishlistItems(allProductIds);
          setTotalItems(totalCount);

          // Set the default wishlist as selected
          const defaultWishlist = result.wishlists.find((w) => w.isDefault);
          if (defaultWishlist) {
            setSelectedWishlistId(defaultWishlist.id);
          } else if (result.wishlists.length > 0) {
            setSelectedWishlistId(result.wishlists[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching wishlists:", error);
        toast.error("Failed to load wishlists");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlists();
  }, [setWishlistItems, setTotalItems]);

  const selectedWishlist = wishlists.find((w) => w.id === selectedWishlistId);

  // Refresh wishlists data
  const refreshWishlists = async () => {
    try {
      const result = await getUserWishlists();
      if (result.success && result.wishlists) {
        setWishlists(result.wishlists);

        // Update the global sync state
        const allProductIds: string[] = [];
        let totalCount = 0;

        result.wishlists.forEach((wishlist: any) => {
          if (wishlist.items) {
            wishlist.items.forEach((item: any) => {
              allProductIds.push(item.productId);
              totalCount++;
            });
          }
        });

        setWishlistItems(allProductIds);
        setTotalItems(totalCount);
      }
    } catch (error) {
      console.error("Error refreshing wishlists:", error);
    }
  };

  // Refresh only local wishlists state (for flyout display)
  const refreshLocalWishlists = async () => {
    try {
      // Small delay to ensure database has been updated
      await new Promise((resolve) => setTimeout(resolve, 50));

      const result = await getUserWishlists();
      if (result.success && result.wishlists) {
        setWishlists(result.wishlists);
      }
    } catch (error) {
      console.error("Error refreshing local wishlists:", error);
    }
  };

  // Handle wishlist creation from modal
  const handleWishlistCreated = async () => {
    // Refresh wishlists
    const updatedResult = await getUserWishlists();
    if (updatedResult.success && updatedResult.wishlists) {
      setWishlists(updatedResult.wishlists);

      // Update the global sync state
      const allProductIds: string[] = [];
      let totalCount = 0;

      updatedResult.wishlists.forEach((wishlist: any) => {
        if (wishlist.items) {
          wishlist.items.forEach((item: any) => {
            allProductIds.push(item.productId);
            totalCount++;
          });
        }
      });

      setWishlistItems(allProductIds);
      setTotalItems(totalCount);

      // Set the newly created wishlist as selected
      const newWishlist =
        updatedResult.wishlists[updatedResult.wishlists.length - 1];
      if (newWishlist) {
        setSelectedWishlistId(newWishlist.id);
      }
    }
  };

  // Navigate to wishlist dashboard
  const handleManageWishlists = () => {
    setIsOpen(false);
    const dashboardPath =
      userRole === "SELLER"
        ? "/seller/dashboard/wishlists"
        : "/dashboard/wishlists";
    router.push(dashboardPath);
  };

  // Get the current wishlist items with product data
  const getCurrentWishlistItems = () => {
    if (!selectedWishlist) return [];

    // Return all items from the selected wishlist - don't filter by global state
    // The global state is for the count and heart states, but the flyout should show
    // the actual wishlist items from the database
    return selectedWishlist.items || [];
  };

  const currentItems = getCurrentWishlistItems();

  // Refresh wishlists when the flyout opens
  useEffect(() => {
    if (isOpen) {
      refreshLocalWishlists();
    }
  }, [isOpen]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full hover:bg-brand-primary-50 hover:text-brand-primary-700 transition-colors"
          aria-label="View wishlist"
        >
          <Heart className="h-5 w-5" />

          {/* Badge showing total items — uses primary (brand purple) */}
          {!isLoading && totalItems > 0 && (
            <Badge
              variant="default"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center min-w-0"
            >
              {totalItems > 99 ? "99+" : totalItems}
            </Badge>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-brand-dark-neutral-200 animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 bg-brand-light-neutral-50 border-brand-dark-neutral-200" align="end">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">My Wishlists</h3>
            <Badge variant="outline" className="text-xs">
              {totalItems} items
            </Badge>
          </div>

          {/* Wishlist Selector */}
          <div className="mb-4">
            <Select
              value={selectedWishlistId}
              onValueChange={setSelectedWishlistId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select wishlist" />
              </SelectTrigger>
              <SelectContent>
                {wishlists.map((wishlist) => (
                  <SelectItem key={wishlist.id} value={wishlist.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{wishlist.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {wishlist.items?.length || 0}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons — hover uses brand primary, not accent/tertiary */}
          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManageWishlists}
              className="flex-1 border-brand-dark-neutral-200 hover:bg-brand-primary-50 hover:text-brand-primary-700 hover:border-brand-primary-200"
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage
            </Button>
            <CreateWishlistModal
              onWishlistCreated={handleWishlistCreated}
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-brand-dark-neutral-200 hover:bg-brand-primary-50 hover:text-brand-primary-700 hover:border-brand-primary-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New
                </Button>
              }
            />
          </div>

          <Separator className="mb-4" />

          {/* Wishlist Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">
                {selectedWishlist?.name || "Select a wishlist"}
              </h4>
              {selectedWishlist && (
                <Badge variant="secondary" className="text-xs">
                  {currentItems.length} items
                </Badge>
              )}
            </div>

            {/* Items List */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
                </div>
              ) : currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <WishlistItemCard
                    key={item.id}
                    item={item}
                    wishlist={selectedWishlist}
                    onUpdate={refreshWishlists}
                    compact={true}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No items in this wishlist</p>
                  <p className="text-xs mt-1">Add products while shopping!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

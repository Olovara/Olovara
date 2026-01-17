"use client";

import { useState, useEffect } from "react";
import QuantitySelector from "@/components/QuantitySelector";
import CheckoutButton from "@/components/CheckoutButton";
import ReportButton from "@/components/ReportButton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CountdownTimer } from "@/components/CountdownTimer";
import { Heart } from "lucide-react";
import { toggleWishlistItem, getUserWishlists } from "@/actions/wishlistActions";
import { toast } from "sonner";
import { useIsInWishlist, useWishlistLoading, useWishlistSync } from "@/hooks/useWishlistSync";

interface ProductActionsProps {
  productId: string;
  productName: string;
  maxStock: number;
  dropDate?: Date | null;
  dropTime?: string | null;
  isDigital?: boolean;
  price?: number;
  shippingCost?: number;
  handlingFee?: number;
  sellerId?: string;
  onSale?: boolean;
  discount?: number | null;
}

export default function ProductActions({
  productId,
  productName,
  maxStock,
  dropDate,
  dropTime,
  isDigital = false,
  price = 0,
  shippingCost = 0,
  handlingFee = 0,
  sellerId,
  onSale = false,
  discount = null,
}: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [isDropActive, setIsDropActive] = useState(false);
  const [orderInstructions, setOrderInstructions] = useState<string>("");

  // Use the sync system for wishlist state
  const isInWishlist = useIsInWishlist(productId);
  const isWishlistLoading = useWishlistLoading(productId);
  const { addToWishlist, removeFromWishlist, setLoadingState } = useWishlistSync();

  // Check if drop is active
  useEffect(() => {
    if (dropDate && dropTime) {
      const [hours, minutes] = dropTime.split(":").map(Number);
      const dropDateTime = new Date(dropDate);
      dropDateTime.setHours(hours, minutes, 0, 0);
      setIsDropActive(dropDateTime.getTime() <= new Date().getTime());

      // Set up interval to check drop status
      const interval = setInterval(() => {
        setIsDropActive(dropDateTime.getTime() <= new Date().getTime());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [dropDate, dropTime]);

  // Check if product is in wishlist on component mount
  useEffect(() => {
    const checkWishlistStatus = async () => {
      try {
        const result = await getUserWishlists();
        if (result.success && result.wishlists) {
          const isInAnyWishlist = result.wishlists.some((wishlist: any) =>
            wishlist.items.some((item: any) => item.productId === productId)
          );
          
          // Update the global state
          if (isInAnyWishlist) {
            addToWishlist(productId);
          } else {
            removeFromWishlist(productId);
          }
        }
      } catch (error) {
        console.error("Error checking wishlist status:", error);
      }
    };

    checkWishlistStatus();
  }, [productId, addToWishlist, removeFromWishlist]);

  // Handle adding/removing from wishlist
  const handleWishlistToggle = async () => {
    // Optimistic update
    if (isInWishlist) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(productId);
    }
    
    setLoadingState(productId, true);
    
    try {
      const result = await toggleWishlistItem({
        productId,
      });
      
      if (result.success) {
        toast.success(result.action === "added" ? "Added to wishlist!" : "Removed from wishlist!");
      } else {
        // Revert optimistic update on error
        if (result.action === "added") {
          removeFromWishlist(productId);
        } else {
          addToWishlist(productId);
        }
        toast.error(result.error || "Failed to update wishlist");
      }
    } catch (error) {
      // Revert optimistic update on error
      if (isInWishlist) {
        addToWishlist(productId);
      } else {
        removeFromWishlist(productId);
      }
      toast.error("Something went wrong");
    } finally {
      setLoadingState(productId, false);
    }
  };

  const isOutOfStock = maxStock === 0;
  const isDropProduct = dropDate && dropTime;
  const canBuy = !isOutOfStock && (!isDropProduct || isDropActive);

  return (
    <div className="space-y-4">
      {isDropProduct && (
        <CountdownTimer
          dropDate={dropDate}
          dropTime={dropTime}
          className="mb-4"
        />
      )}
      
      {canBuy ? (
        <>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <QuantitySelector
                name="quantity"
                maxQuantity={maxStock}
                quantity={quantity}
                setQuantity={setQuantity}
              />
            </div>
            
            {/* Wishlist Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleWishlistToggle}
              disabled={isWishlistLoading}
              className="h-12 w-12 rounded-full border-2 hover:border-purple-500 transition-colors"
            >
              <Heart 
                className={`h-5 w-5 transition-colors ${
                  isInWishlist 
                    ? "fill-purple-600 text-purple-600" 
                    : "text-gray-600 hover:text-purple-600"
                }`} 
              />
            </Button>
          </div>
          
          <CheckoutButton 
            productId={productId} 
            quantity={quantity}
            isDigital={isDigital}
            price={price}
            shippingCost={shippingCost}
            handlingFee={handlingFee}
            sellerId={sellerId}
            onSale={onSale}
            discount={discount}
            orderInstructions={orderInstructions}
          />
          
          {/* Order Instructions/Personalization Text Box */}
          <div className="space-y-2">
            <Label htmlFor="orderInstructions" className="text-sm font-medium text-gray-700">
              Order Instructions / Personalization (Optional)
            </Label>
            <Textarea
              id="orderInstructions"
              placeholder="Add any special instructions or personalization requests for the seller..."
              value={orderInstructions}
              onChange={(e) => setOrderInstructions(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-gray-500">
              {orderInstructions.length}/1000 characters
            </p>
          </div>
        </>
      ) : (
        <Button disabled className="w-full">
          {isOutOfStock
            ? "Out of Stock"
            : isDropProduct && !isDropActive
            ? "Coming Soon"
            : "Unavailable"}
        </Button>
      )}

      {/* Report Button */}
      <div className="pt-2 border-t">
        <ReportButton
          reportType="PRODUCT"
          targetId={productId}
          targetName={productName}
          variant="ghost"
          size="sm"
          className="w-full justify-center text-gray-500 hover:text-red-600"
        >
          Report Product
        </ReportButton>
      </div>
    </div>
  );
}

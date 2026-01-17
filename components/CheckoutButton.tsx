"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/useCurrency";
import AuthRequirementModal from "@/components/AuthRequirementModal";
import { useLocation } from "@/hooks/useLocation";
import { useRouter } from "next/navigation";

interface CheckoutButtonProps {
  productId: string;
  quantity: number;
  isDigital?: boolean;
  price?: number;
  shippingCost?: number;
  handlingFee?: number;
  sellerId?: string;
  onSale?: boolean;
  discount?: number | null;
  orderInstructions?: string; // Optional order instructions from buyer
}

const CheckoutButton = ({
  productId,
  quantity,
  isDigital = false,
  price = 0,
  shippingCost = 0,
  handlingFee = 0,
  sellerId,
  onSale = false,
  discount = null,
  orderInstructions = "",
}: CheckoutButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authReason, setAuthReason] = useState<"high_value" | "digital_item">(
    "high_value"
  );
  const [orderValue, setOrderValue] = useState<number>(0);
  const { currency } = useCurrency();
  const [userCountry, setUserCountry] = useState<string>("");
  const { locationPreferences } = useLocation();
  const router = useRouter();

  // Get user's country from location provider
  useEffect(() => {
    if (locationPreferences?.countryCode) {
      setUserCountry(locationPreferences.countryCode);
    }
  }, [locationPreferences]);

  const handleCheckout = async () => {
    setLoading(true);
    
    try {
      // Calculate order value for authentication check
      const productPriceInDollars = price / 100;
      const shippingCostInDollars = shippingCost / 100;
      const handlingFeeInDollars = handlingFee / 100;
      const totalOrderValue = (productPriceInDollars + shippingCostInDollars + handlingFeeInDollars) * quantity;

      // Check if authentication is required
      const requiresAuth = totalOrderValue >= 100 || isDigital;

      if (requiresAuth) {
        // Show authentication modal
        setOrderValue(totalOrderValue);
        setAuthReason(isDigital ? "digital_item" : "high_value");
        setShowAuthModal(true);
        setLoading(false);
        return;
      }

      // If no auth required, proceed to checkout
      // Pass order instructions via URL params (encode to handle special characters)
      const params = new URLSearchParams({
        quantity: quantity.toString(),
      });
      if (orderInstructions && orderInstructions.trim()) {
        params.append("instructions", orderInstructions.trim());
      }
      router.push(`/checkout/${productId}?${params.toString()}`);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={handleCheckout} disabled={loading} className="w-full">
        {loading ? "Processing..." : "Buy Now"}
      </Button>

      <AuthRequirementModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        reason={authReason}
        orderValue={orderValue}
      />
    </>
  );
};

export default CheckoutButton;

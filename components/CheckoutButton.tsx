"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
  orderInstructions = "",
}: CheckoutButtonProps) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Guest checkout allowed for all products (physical, digital, any price)
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
    <Button onClick={handleCheckout} disabled={loading} className="w-full">
      {loading ? "Processing..." : "Buy Now"}
    </Button>
  );
};

export default CheckoutButton;

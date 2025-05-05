"use client";

import { useState, useEffect } from "react";
import QuantitySelector from "@/components/QuantitySelector";
import CheckoutButton from "@/components/CheckoutButton";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/CountdownTimer";

interface ProductActionsProps {
  productId: string;
  maxStock: number;
  dropDate?: Date | null;
  dropTime?: string | null;
}

export default function ProductActions({
  productId,
  maxStock,
  dropDate,
  dropTime,
}: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [isDropActive, setIsDropActive] = useState(false);

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
          <QuantitySelector
            name="quantity"
            maxQuantity={maxStock}
            quantity={quantity}
            setQuantity={setQuantity}
          />
          <div className="pb-3"></div>
          <CheckoutButton productId={productId} quantity={quantity} />
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
    </div>
  );
}

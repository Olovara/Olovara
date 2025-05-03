"use client";

import { useState } from "react";
import QuantitySelector from "@/components/QuantitySelector";
import CheckoutButton from "@/components/CheckoutButton";
import { Button } from "@/components/ui/button";

export default function ProductActions({
  productId,
  maxStock,
}: {
  productId: string;
  maxStock: number;
}) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div>
      {maxStock > 0 ? (
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
          Out of Stock
        </Button>
      )}
    </div>
  );
}

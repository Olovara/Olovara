"use client";

import { useState } from "react";
import QuantitySelector from "@/components/QuantitySelector";
import CheckoutButton from "@/components/CheckoutButton";

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
      <QuantitySelector
        name="quantity"
        maxQuantity={maxStock}
        quantity={quantity}
        setQuantity={setQuantity}
      />
      <div className="pb-3"></div>
      <CheckoutButton productId={productId} quantity={quantity} />
    </div>
  );
}

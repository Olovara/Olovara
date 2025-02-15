"use client";
import { useState } from "react";

export default function QuantitySelector({ name }: { name: string }) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex items-center space-x-4">
      {/* Decrease Button */}
      <button
        type="button"
        className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 text-gray-900 hover:bg-gray-300 text-4xl leading-none relative"
        onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
      >
        <span className="relative -top-0.5">-</span>
      </button>

      {/* Quantity Display (Hidden Input for Form Submission) */}
      <span className="w-10 text-center text-xl font-bold">{quantity}</span>
      <input type="hidden" name={name} value={quantity} />

      {/* Increase Button */}
      <button
        type="button"
        className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 text-gray-900 hover:bg-gray-300 text-3xl leading-none"
        onClick={() => setQuantity((prev) => prev + 1)}
      >
        <span className="relative -top-0.5">+</span>
      </button>
    </div>
  );
}

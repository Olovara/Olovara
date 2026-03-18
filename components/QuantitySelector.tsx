"use client";
import { Dispatch, SetStateAction, useState } from "react";

export default function QuantitySelector({
  name,
  maxQuantity,
  quantity,
  setQuantity,
}: {
  name: string;
  maxQuantity: number;
  quantity: number;
  setQuantity: Dispatch<SetStateAction<number>>;
}) {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-4">
        {/* Decrease Button */}
        <button
          type="button"
          className="w-12 h-12 flex items-center justify-center rounded-full bg-brand-light-neutral-50 text-brand-dark-neutral-900 border border-brand-dark-neutral-200 hover:bg-brand-primary-50 hover:text-brand-primary-700 text-4xl leading-none relative disabled:opacity-50 disabled:hover:bg-brand-light-neutral-50 disabled:hover:text-brand-dark-neutral-900"
          onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
          disabled={quantity <= 1}
        >
          <span className="relative -top-0.5">-</span>
        </button>

        {/* Quantity Display (Hidden Input for Form Submission) */}
        <span className="w-10 text-center text-xl font-bold">{quantity}</span>
        <input type="hidden" name={name} value={quantity} />

        {/* Increase Button */}
        <button
          type="button"
          className="w-12 h-12 flex items-center justify-center rounded-full bg-brand-light-neutral-50 text-brand-dark-neutral-900 border border-brand-dark-neutral-200 hover:bg-brand-primary-50 hover:text-brand-primary-700 text-3xl leading-none disabled:opacity-50 disabled:hover:bg-brand-light-neutral-50 disabled:hover:text-brand-dark-neutral-900"
          onClick={() => setQuantity((prev) => Math.min(maxQuantity, prev + 1))}
          disabled={quantity >= maxQuantity}
        >
          <span className="relative -top-0.5">+</span>
        </button>
      </div>
    </div>
  );
}

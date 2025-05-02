"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  className?: string;
  interactive?: boolean;
}

export function StarRating({
  rating,
  onRatingChange,
  className,
  interactive = true,
}: StarRatingProps) {
  return (
    <div className={cn("flex gap-1", className)}>
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            interactive && onRatingChange(value);
          }}
          className={cn(
            "focus:outline-none",
            !interactive && "cursor-default"
          )}
        >
          <Star
            className={cn(
              "h-6 w-6",
              value <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  );
} 
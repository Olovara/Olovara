"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { StarRating } from "../star-rating";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";

interface ReviewFormProps {
  orderId: string;
  reviewerId: string;
  reviewedId: string;
  productId?: string;
  type: "PRODUCT" | "SELLER" | "BUYER";
  onSuccess?: () => void;
}

export function ReviewForm({
  orderId,
  reviewerId,
  reviewedId,
  productId,
  type,
  onSuccess,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          reviewerId,
          reviewedId,
          productId,
          rating,
          comment,
          type,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      toast.success("Review submitted successfully!");
      if (onSuccess) {
        onSuccess();
      }
      router.refresh();
    } catch (error) {
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case "PRODUCT":
        return "Rate the Product";
      case "SELLER":
        return "Rate the Seller";
      case "BUYER":
        return "Rate the Buyer";
      default:
        return "Leave a Review";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">{getTitle()}</h3>
        <StarRating
          rating={rating}
          onRatingChange={setRating}
          className="mb-4"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="comment"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Add a comment (optional)
        </label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          className="min-h-[100px]"
        />
      </div>

      <Button
        type="submit"
        disabled={rating === 0 || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
} 
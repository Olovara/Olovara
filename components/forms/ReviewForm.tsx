"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { StarRating } from "../star-rating";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { ReviewSchema, type ReviewFormData } from "@/schemas/ReviewSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

interface ReviewFormProps {
  orderId: string;
  reviewerId: string;
  reviewedId: string;
  productId?: string;
  type: "PRODUCT" | "SELLER" | "BUYER";
  initialRating?: number;
  initialComment?: string;
  onSuccess?: () => void;
}

export function ReviewForm({
  orderId,
  reviewerId,
  reviewedId,
  productId,
  type,
  initialRating = 0,
  initialComment = "",
  onSuccess,
}: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(ReviewSchema),
    defaultValues: {
      orderId,
      reviewerId,
      reviewedId,
      productId,
      type,
      rating: initialRating,
      comment: initialComment,
      status: "PENDING",
    },
  });

  const onSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to submit review");
      }

      toast.success("Review submitted successfully!");
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Review submission error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit review. Please try again.");
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">{getTitle()}</h3>
        <StarRating
          rating={form.watch("rating")}
          onRatingChange={(rating) => form.setValue("rating", rating)}
          className="mb-4"
          interactive={true}
        />
        {form.formState.errors.rating && (
          <p className="text-sm text-red-500 mt-1">
            {form.formState.errors.rating.message}
          </p>
        )}
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
          {...form.register("comment")}
          placeholder="Share your experience..."
          className="min-h-[100px]"
        />
        {form.formState.errors.comment && (
          <p className="text-sm text-red-500 mt-1">
            {form.formState.errors.comment.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
} 
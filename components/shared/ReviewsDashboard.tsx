"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewForm } from "@/components/forms/ReviewForm";
import { RatingDisplay } from "@/components/rating-display";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface Review {
  id: string;
  orderId: string;
  reviewerId: string;
  reviewedId: string;
  productId: string | null;
  rating: number;
  comment: string | null;
  type: "PRODUCT" | "SELLER" | "BUYER";
  status: "PENDING" | "PUBLISHED" | "EXPIRED" | "COMPLETED";
  createdAt: Date;
  expiresAt: Date;
  product: {
    name: string;
    images: string[];
    userId?: string;
  } | null;
  reviewer: {
    username: string | null;
    image: string | null;
  };
  reviewed: {
    username: string | null;
    image: string | null;
  };
}

interface ReviewsDashboardProps {
  pendingReviews: Review[];
  completedReviews: Review[];
  publishedReviews: Review[];
  receivedReviews: Review[];
  userRole: "MEMBER" | "SELLER";
}

export function ReviewsDashboard({
  pendingReviews,
  completedReviews,
  publishedReviews,
  receivedReviews,
  userRole,
}: ReviewsDashboardProps) {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const getReviewTitle = (review: Review) => {
    switch (review.type) {
      case "PRODUCT":
        return `Review for Product: ${review.product?.name || "Product"}`;
      case "SELLER":
        return `Review for Seller: ${review.reviewed?.username || "Seller"}`;
      case "BUYER":
        return `Review for Buyer: ${review.reviewed?.username || "Buyer"}`;
      default:
        return "Review";
    }
  };

  const getReviewStatus = (review: Review) => {
    if (review.status === "PENDING") {
      const expiresIn = formatDistanceToNow(new Date(review.expiresAt), {
        addSuffix: true,
      });
      return `Expires ${expiresIn}`;
    }
    if (review.status === "COMPLETED") {
      const daysLeft = Math.ceil((new Date(review.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return `Editable for ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`;
    }
    return review.status;
  };

  const renderReviewCard = (review: Review) => (
    <Card key={review.id} className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{getReviewTitle(review)}</span>
          <Badge variant={review.status === "PENDING" ? "default" : "secondary"}>
            {getReviewStatus(review)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {review.status === "PENDING" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please complete your review before it expires.
            </p>
            <Button
              onClick={() => setSelectedReview(review)}
              className="w-full"
            >
              Complete Review
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <RatingDisplay rating={review.rating} count={1} showCount={false} />
            {review.comment && (
              <p className="text-sm text-muted-foreground">{review.comment}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Reviewed {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
            </p>
            {review.status === "COMPLETED" && (
              <Button
                variant="outline"
                onClick={() => setSelectedReview(review)}
                className="w-full mt-2"
              >
                Edit Review
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {selectedReview && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setSelectedReview(null)}
        >
          <Card 
            className="w-full max-w-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => setSelectedReview(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            <CardHeader>
              <CardTitle>{getReviewTitle(selectedReview)}</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewForm
                orderId={selectedReview.orderId}
                reviewerId={selectedReview.reviewerId}
                reviewedId={selectedReview.reviewedId}
                productId={selectedReview.productId || undefined}
                type={selectedReview.type}
                initialRating={selectedReview.rating}
                initialComment={selectedReview.comment || ""}
                onSuccess={() => {
                  setSelectedReview(null);
                  window.location.reload();
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pending Reviews</TabsTrigger>
          <TabsTrigger value="completed">Completed Reviews</TabsTrigger>
          <TabsTrigger value="published">Published Reviews</TabsTrigger>
          <TabsTrigger value="received">Received Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingReviews.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No pending reviews
            </p>
          ) : (
            pendingReviews.map(renderReviewCard)
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedReviews.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No completed reviews
            </p>
          ) : (
            completedReviews.map(renderReviewCard)
          )}
        </TabsContent>

        <TabsContent value="published" className="space-y-4">
          {publishedReviews.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No published reviews
            </p>
          ) : (
            publishedReviews.map(renderReviewCard)
          )}
        </TabsContent>

        <TabsContent value="received" className="space-y-4">
          {receivedReviews.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No received reviews
            </p>
          ) : (
            receivedReviews.map(renderReviewCard)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 
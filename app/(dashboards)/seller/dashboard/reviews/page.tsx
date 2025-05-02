import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ReviewsDashboard } from "@/components/shared/ReviewsDashboard";

interface Review {
  id: string;
  orderId: string;
  reviewerId: string;
  reviewedId: string;
  sellerId: string;
  productId: string | null;
  rating: number;
  comment: string | null;
  type: "PRODUCT" | "SELLER" | "BUYER";
  status: "PENDING" | "COMPLETED" | "PUBLISHED" | "EXPIRED";
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

export default async function SellerReviewsPage() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  const reviews = await db.review.findMany({
    where: {
      OR: [
        { reviewerId: session.user.id },
        { reviewedId: session.user.id },
        { product: { userId: session.user.id } },
      ],
    },
    include: {
      product: {
        select: {
          name: true,
          images: true,
          userId: true,
        },
      },
      reviewer: {
        select: {
          username: true,
          image: true,
        },
      },
      reviewed: {
        select: {
          username: true,
          image: true,
        },
      },
    },
  });

  // Cast the type and status fields to match our interface
  const typedReviews = reviews.map((review) => ({
    ...review,
    type: review.type as "PRODUCT" | "SELLER" | "BUYER",
    status: review.status as "PENDING" | "COMPLETED" | "PUBLISHED" | "EXPIRED",
  })) as Review[];

  // Helper function to check if a review is a buyer review
  const isBuyerReview = (review: Review): review is Review & { type: "BUYER" } => {
    return review.type === "BUYER";
  };

  // Filter reviews based on status and user role
  const pendingReviews = typedReviews.filter((review) => {
    // For sellers, show buyer reviews for their own orders that are pending
    if (review.type === "BUYER" && review.sellerId === session.user.id && review.status === "PENDING") {
      return true;
    }
    
    // For all other review types, show pending reviews where the seller is the reviewer
    return review.status === "PENDING" && review.reviewerId === session.user.id;
  });

  const completedReviews = typedReviews.filter((review) => {
    // For sellers, show buyer reviews for their own orders that are completed
    if (review.type === "BUYER" && review.sellerId === session.user.id && review.status === "COMPLETED") {
      return true;
    }
    
    // For all other review types, show completed reviews where the seller is the reviewer
    return review.status === "COMPLETED" && review.reviewerId === session.user.id;
  });

  const publishedReviews = typedReviews.filter((review) => {
    // For sellers, show buyer reviews for their own orders that are published
    if (review.type === "BUYER" && review.sellerId === session.user.id && review.status === "PUBLISHED") {
      return true;
    }
    
    // For all other review types, show published reviews where the seller is the reviewer
    return review.status === "PUBLISHED" && review.reviewerId === session.user.id;
  });

  const receivedReviews = typedReviews.filter((review) => {
    // Show reviews where the seller is the reviewed user
    if (review.reviewedId === session.user.id && review.status === "PUBLISHED") {
      return true;
    }
    
    // Show reviews for the seller's products
    if (review.product?.userId === session.user.id && review.status === "PUBLISHED") {
      return true;
    }
    
    return false;
  });

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">My Reviews</h1>
      <ReviewsDashboard
        pendingReviews={pendingReviews}
        completedReviews={completedReviews}
        publishedReviews={publishedReviews}
        receivedReviews={receivedReviews}
        userRole="SELLER"
      />
    </div>
  );
}

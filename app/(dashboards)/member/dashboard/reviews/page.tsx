import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ReviewsDashboard } from "@/components/shared/ReviewsDashboard";
import { redirect } from "next/navigation";

interface Review {
  id: string;
  orderId: string;
  sellerId: string;
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
  seller: {
    user: {
      username: string | null;
      image: string | null;
    } | null;
  } | null;
}

export default async function MemberReviewsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  const reviews = await db.review.findMany({
    where: {
      OR: [{ reviewerId: session.user.id }, { reviewedId: session.user.id }],
    },
    include: {
      product: {
        select: {
          name: true,
          images: true,
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
      seller: {
        select: {
          user: {
            select: {
              username: true,
              image: true,
            },
          },
        },
      },
    },
  });

  // Transform the reviews to ensure we have the correct reviewed user info
  const typedReviews = reviews.map((review) => {
    // For product and seller reviews, use the seller's user info if available
    if ((review.type === "PRODUCT" || review.type === "SELLER") && review.seller?.user) {
      return {
        ...review,
        reviewed: {
          username: review.seller.user.username,
          image: review.seller.user.image,
        },
      };
    }
    return review;
  }) as Review[];

  // Helper function to check if a review is a buyer review
  const isBuyerReview = (review: Review): review is Review & { type: "BUYER" } => {
    return review.type === "BUYER";
  };

  // Filter reviews based on status and user role
  const pendingReviews = typedReviews.filter((review) => {
    // Don't show buyer reviews in pending reviews for buyers
    if (review.type === "BUYER" && review.reviewerId === session.user.id) {
      return false;
    }
    
    // Show all other pending reviews where the member is the reviewer
    return review.status === "PENDING" && review.reviewerId === session.user.id;
  });

  const completedReviews = typedReviews.filter((review) => {
    // Don't show buyer reviews in completed reviews for buyers
    if (review.type === "BUYER" && review.reviewerId === session.user.id) {
      return false;
    }
    
    // Show all other completed reviews where the member is the reviewer
    return review.status === "COMPLETED" && review.reviewerId === session.user.id;
  });

  const publishedReviews = typedReviews.filter((review) => {
    // Don't show buyer reviews in published reviews for buyers
    if (review.type === "BUYER" && review.reviewerId === session.user.id) {
      return false;
    }
    
    // Show all other published reviews where the member is the reviewer
    return review.status === "PUBLISHED" && review.reviewerId === session.user.id;
  });

  const receivedReviews = typedReviews.filter((review) => {
    // Show reviews where the member is the reviewed user
    if (review.reviewedId === session.user.id && review.status === "PUBLISHED") {
      return true;
    }
    
    // Show reviews for the member's products
    if (review.product?.userId === session.user.id && review.status === "PUBLISHED") {
      return true;
    }
    
    return false;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Reviews</h1>
      <ReviewsDashboard
        pendingReviews={pendingReviews}
        completedReviews={completedReviews}
        publishedReviews={publishedReviews}
        receivedReviews={receivedReviews}
        userRole="MEMBER"
      />
    </div>
  );
} 
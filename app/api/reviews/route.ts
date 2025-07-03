import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";

const reviewSchema = z.object({
  orderId: z.string(),
  reviewerId: z.string(),
  reviewedId: z.string(),
  productId: z.string().optional(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  type: z.enum(["PRODUCT", "SELLER", "BUYER"]),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validatedData = reviewSchema.parse(body);

    // Validate ObjectIDs
    if (!ObjectId.isValid(validatedData.orderId)) {
      return new NextResponse("Invalid order ID format", { status: 400 });
    }
    if (!ObjectId.isValid(validatedData.reviewerId)) {
      return new NextResponse("Invalid reviewer ID format", { status: 400 });
    }
    if (!ObjectId.isValid(validatedData.reviewedId)) {
      return new NextResponse("Invalid reviewed ID format", { status: 400 });
    }
    if (validatedData.productId && !ObjectId.isValid(validatedData.productId)) {
      return new NextResponse("Invalid product ID format", { status: 400 });
    }

    // Check if the review already exists
    const existingReview = await db.review.findFirst({
      where: {
        orderId: validatedData.orderId,
        reviewerId: validatedData.reviewerId,
        reviewedId: validatedData.reviewedId,
        type: validatedData.type,
        status: { in: ["PENDING", "COMPLETED"] },
      },
    });

    // Check if all reviews for this order are completed
    const allReviews = await db.review.findMany({
      where: {
        orderId: validatedData.orderId,
      },
    });

    const allCompleted = allReviews.every((review) => review.status === "COMPLETED" || review.status === "PUBLISHED");
    if (allCompleted) {
      // Update all reviews to PUBLISHED
      await db.review.updateMany({
        where: {
          orderId: validatedData.orderId,
        },
        data: {
          status: "PUBLISHED",
        },
      });
    }

    let review;
    if (existingReview) {
      // Check if the review has expired
      if (new Date(existingReview.expiresAt) < new Date()) {
        // If the review was completed, publish it
        if (existingReview.status === "COMPLETED") {
          review = await db.review.update({
            where: {
              id: existingReview.id,
            },
            data: {
              status: "PUBLISHED",
            },
          });
        } else {
          // Delete the expired review
          await db.review.delete({
            where: {
              id: existingReview.id,
            },
          });
          return new NextResponse(
            JSON.stringify({ message: "This review has expired and has been deleted." }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
      } else {
        // Update existing review
        review = await db.review.update({
          where: {
            id: existingReview.id,
          },
          data: {
            rating: validatedData.rating,
            comment: validatedData.comment,
            status: "COMPLETED",
          },
        });
      }
    } else {
      // Create new review
      review = await db.review.create({
        data: {
          ...validatedData,
          status: "COMPLETED",
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          sellerId: validatedData.reviewedId, // For seller reviews, the reviewedId is the sellerId
        },
      });
    }

    // Check if all reviews are now completed
    const updatedAllReviews = await db.review.findMany({
      where: {
        orderId: validatedData.orderId,
      },
    });

    const allNowCompleted = updatedAllReviews.every((review) => review.status === "COMPLETED");
    if (allNowCompleted) {
      // Update all reviews to PUBLISHED
      await db.review.updateMany({
        where: {
          orderId: validatedData.orderId,
        },
        data: {
          status: "PUBLISHED",
        },
      });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error("[REVIEWS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type");

    if (!userId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    // Validate that the userId is a valid ObjectID
    if (!ObjectId.isValid(userId)) {
      return new NextResponse("Invalid user ID format", { status: 400 });
    }

    const reviews = await db.review.findMany({
      where: {
        OR: [
          { reviewerId: userId },
          { reviewedId: userId },
        ],
        ...(type ? { type } : {}),
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("[REVIEWS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 
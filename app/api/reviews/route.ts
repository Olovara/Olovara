import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

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
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    body = await req.json();
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

    const allCompleted = allReviews.every(
      (review) => review.status === "COMPLETED" || review.status === "PUBLISHED"
    );
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
            JSON.stringify({
              message: "This review has expired and has been deleted.",
            }),
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

    const allNowCompleted = updatedAllReviews.every(
      (review) => review.status === "COMPLETED"
    );
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
    // Log to console (always happens)
    console.error("[REVIEWS_POST]", error);

    // Check if it's a ZodError (validation error) - don't log these to DB
    if (error && typeof error === "object" && "issues" in error) {
      // Validation errors are expected - just return error, don't log to DB
      const zodError = error as {
        issues: Array<{ message: string; path: (string | number)[] }>;
      };
      return new NextResponse(
        JSON.stringify({
          error: "Validation failed",
          details: zodError.issues,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Log to database - user could email about "couldn't submit my review"
    const userMessage = logError({
      code: "REVIEW_CREATE_FAILED",
      userId: session?.user?.id,
      route: "/api/reviews",
      method: "POST",
      error,
      metadata: {
        orderId: body?.orderId,
        reviewerId: body?.reviewerId,
        reviewedId: body?.reviewedId,
        productId: body?.productId,
        reviewType: body?.type,
        rating: body?.rating,
        note: "Failed to create or update review",
      },
    });

    return new NextResponse(JSON.stringify({ error: userMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET(req: Request) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();
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
        OR: [{ reviewerId: userId }, { reviewedId: userId }],
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
    // Log to console (always happens)
    console.error("[REVIEWS_GET]", error);

    // Log to database - user could email about "can't see reviews"
    const userMessage = logError({
      code: "REVIEW_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/reviews",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch reviews",
      },
    });

    return new NextResponse(JSON.stringify({ error: userMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

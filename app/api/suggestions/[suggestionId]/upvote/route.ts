import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { logError } from "@/lib/error-logger";

export async function POST(
  req: Request,
  { params }: { params: { suggestionId: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let suggestionId: string | undefined = undefined;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    suggestionId = params.suggestionId;

    // Validate that the suggestionId is a valid ObjectID
    if (!ObjectId.isValid(suggestionId)) {
      return new NextResponse("Invalid suggestion ID format", { status: 400 });
    }

    // Check if user has already upvoted
    const existingUpvote = await db.upvote.findUnique({
      where: {
        userId_suggestionId: {
          userId: session.user.id,
          suggestionId,
        },
      },
    });

    if (existingUpvote) {
      return new NextResponse("Already upvoted", { status: 400 });
    }

    // Create upvote and increment count
    await db.$transaction([
      db.upvote.create({
        data: {
          userId: session.user.id,
          suggestionId,
        },
      }),
      db.suggestion.update({
        where: { id: suggestionId },
        data: {
          upvoteCount: {
            increment: 1,
          },
        },
      }),
    ]);

    return new NextResponse("Upvoted successfully");
  } catch (error) {
    // Log to console (always happens)
    console.error("[SUGGESTION_UPVOTE_POST]", error);

    // Don't log validation errors - they're expected client-side issues
    // (Invalid ID format, already upvoted are handled with 400 status)

    // Log to database - user could email about "couldn't upvote suggestion"
    const userMessage = logError({
      code: "SUGGESTION_UPVOTE_FAILED",
      userId: session?.user?.id,
      route: "/api/suggestions/[suggestionId]/upvote",
      method: "POST",
      error,
      metadata: {
        suggestionId,
        note: "Failed to upvote suggestion",
      },
    });

    return new NextResponse(userMessage, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { suggestionId: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let suggestionId: string | undefined = undefined;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    suggestionId = params.suggestionId;

    // Validate that the suggestionId is a valid ObjectID
    if (!ObjectId.isValid(suggestionId)) {
      return new NextResponse("Invalid suggestion ID format", { status: 400 });
    }

    // Check if user has upvoted
    const existingUpvote = await db.upvote.findUnique({
      where: {
        userId_suggestionId: {
          userId: session.user.id,
          suggestionId,
        },
      },
    });

    if (!existingUpvote) {
      return new NextResponse("Not upvoted", { status: 400 });
    }

    // Remove upvote and decrement count
    await db.$transaction([
      db.upvote.delete({
        where: {
          userId_suggestionId: {
            userId: session.user.id,
            suggestionId,
          },
        },
      }),
      db.suggestion.update({
        where: { id: suggestionId },
        data: {
          upvoteCount: {
            decrement: 1,
          },
        },
      }),
    ]);

    return new NextResponse("Upvote removed successfully");
  } catch (error) {
    // Log to console (always happens)
    console.error("[SUGGESTION_UPVOTE_DELETE]", error);

    // Don't log validation errors - they're expected client-side issues
    // (Invalid ID format, not upvoted are handled with 400 status)

    // Log to database - user could email about "couldn't remove upvote"
    const userMessage = logError({
      code: "SUGGESTION_UPVOTE_REMOVE_FAILED",
      userId: session?.user?.id,
      route: "/api/suggestions/[suggestionId]/upvote",
      method: "DELETE",
      error,
      metadata: {
        suggestionId,
        note: "Failed to remove upvote from suggestion",
      },
    });

    return new NextResponse(userMessage, { status: 500 });
  }
}

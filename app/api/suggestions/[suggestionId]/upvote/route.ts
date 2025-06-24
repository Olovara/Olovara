import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { suggestionId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { suggestionId } = params;

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
    console.error("[SUGGESTION_UPVOTE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { suggestionId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { suggestionId } = params;

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
    console.error("[SUGGESTION_UPVOTE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 
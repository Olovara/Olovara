import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for updating a comment
const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required").max(1000, "Comment too long"),
});

// PUT: Update a comment
export async function PUT(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to edit comments" },
        { status: 401 }
      );
    }

    const { commentId } = params;
    const body = await request.json();
    const validatedData = updateCommentSchema.parse(body);

    // Find the comment and check ownership
    const comment = await db.blogComment.findUnique({
      where: { id: commentId },
      select: { id: true, userEmail: true, isHidden: true },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    if (comment.userEmail !== session.user.email) {
      return NextResponse.json(
        { error: "You can only edit your own comments" },
        { status: 403 }
      );
    }

    if (comment.isHidden) {
      return NextResponse.json(
        { error: "Cannot edit hidden comments" },
        { status: 400 }
      );
    }

    // Update the comment
    const updatedComment = await db.blogComment.update({
      where: { id: commentId },
      data: {
        desc: validatedData.content,
        isEdited: true,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            username: true,
            image: true,
            encryptedFirstName: true,
            encryptedLastName: true,
            firstNameIV: true,
            lastNameIV: true,
          },
        },
      },
    });

    return NextResponse.json(updatedComment);
  } catch (error) {
    console.error("Error updating comment:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid comment data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to delete comments" },
        { status: 401 }
      );
    }

    const { commentId } = params;

    // Find the comment and check ownership
    const comment = await db.blogComment.findUnique({
      where: { id: commentId },
      select: { id: true, userEmail: true, replies: { select: { id: true } } },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Allow deletion if user owns the comment or is admin (you can add admin check here)
    if (comment.userEmail !== session.user.email) {
      return NextResponse.json(
        { error: "You can only delete your own comments" },
        { status: 403 }
      );
    }

    // Delete the comment (this will also delete replies due to cascade)
    await db.blogComment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
} 
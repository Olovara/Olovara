import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { logError } from "@/lib/error-logger";

// Schema for updating a comment
const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment content is required")
    .max(1000, "Comment too long"),
});

// PUT: Update a comment
export async function PUT(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;
  let commentId: string | undefined = undefined;

  try {
    session = await auth();
    commentId = params.commentId;
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to edit comments" },
        { status: 401 }
      );
    }

    body = await request.json();
    const validatedData = updateCommentSchema.parse(body);

    // Find the comment and check ownership
    const comment = await db.blogComment.findUnique({
      where: { id: commentId },
      select: { id: true, userEmail: true, isHidden: true },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
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
    // Log to console (always happens)
    console.error("Error updating comment:", error);

    // Don't log Zod validation errors - they're expected client-side issues
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid comment data", details: error.errors },
        { status: 400 }
      );
    }

    // Log to database - user could email about "couldn't update comment"
    const userMessage = logError({
      code: "BLOG_COMMENT_UPDATE_FAILED",
      userId: session?.user?.id,
      route: "/api/blog/comments/[commentId]",
      method: "PUT",
      error,
      metadata: {
        commentId,
        note: "Failed to update blog comment",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

// DELETE: Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let commentId: string | undefined = undefined;

  try {
    session = await auth();
    commentId = params.commentId;
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to delete comments" },
        { status: 401 }
      );
    }

    // Find the comment and check ownership
    const comment = await db.blogComment.findUnique({
      where: { id: commentId },
      select: { id: true, userEmail: true, replies: { select: { id: true } } },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
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
    // Log to console (always happens)
    console.error("Error deleting comment:", error);

    // Log to database - user could email about "couldn't delete comment"
    const userMessage = logError({
      code: "BLOG_COMMENT_DELETE_FAILED",
      userId: session?.user?.id,
      route: "/api/blog/comments/[commentId]",
      method: "DELETE",
      error,
      metadata: {
        commentId,
        note: "Failed to delete blog comment",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

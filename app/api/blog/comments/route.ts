import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { logError } from "@/lib/error-logger";

// Schema for creating a comment
const createCommentSchema = z.object({
  postSlug: z.string().min(1, "Post slug is required"),
  content: z
    .string()
    .min(1, "Comment content is required")
    .max(1000, "Comment too long"),
  parentId: z.string().optional(), // For replies
});

// GET: Fetch comments for a blog post
export async function GET(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let postSlug: string | null = null;

  try {
    const { searchParams } = new URL(request.url);
    postSlug = searchParams.get("postSlug");

    if (!postSlug) {
      return NextResponse.json(
        { error: "Post slug is required" },
        { status: 400 }
      );
    }

    // First, check if the blog post exists and is public
    const post = await db.blogPost.findUnique({
      where: { slug: postSlug },
      select: { status: true, isPrivate: true, allowComments: true },
    });

    if (
      !post ||
      post.status !== "PUBLISHED" ||
      post.isPrivate ||
      !post.allowComments
    ) {
      return NextResponse.json(
        { error: "Comments not available for this post" },
        { status: 404 }
      );
    }

    // Fetch comments with replies
    const comments = await db.blogComment.findMany({
      where: {
        postSlug,
        parentId: null, // Only top-level comments
        isHidden: false,
      },
      include: {
        user: {
          select: {
            username: true,
            image: true,
            encryptedFirstName: true,
            firstNameIV: true,
          },
        },
        replies: {
          where: { isHidden: false },
          include: {
            user: {
              select: {
                username: true,
                image: true,
                encryptedFirstName: true,
                firstNameIV: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching comments:", error);

    // Don't log validation errors - they're expected client-side issues

    // Log to database - user could email about "can't load comments"
    const userMessage = logError({
      code: "BLOG_COMMENTS_FETCH_FAILED",
      userId: undefined, // Public route
      route: "/api/blog/comments",
      method: "GET",
      error,
      metadata: {
        postSlug,
        note: "Failed to fetch blog comments",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

// POST: Create a new comment
export async function POST(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to comment" },
        { status: 401 }
      );
    }

    body = await request.json();
    const validatedData = createCommentSchema.parse(body);

    // Check if the blog post exists and allows comments
    const post = await db.blogPost.findUnique({
      where: { slug: validatedData.postSlug },
      select: { status: true, isPrivate: true, allowComments: true },
    });

    if (
      !post ||
      post.status !== "PUBLISHED" ||
      post.isPrivate ||
      !post.allowComments
    ) {
      return NextResponse.json(
        { error: "Comments not allowed for this post" },
        { status: 400 }
      );
    }

    // If this is a reply, check if parent comment exists
    if (validatedData.parentId) {
      const parentComment = await db.blogComment.findUnique({
        where: { id: validatedData.parentId },
        select: { id: true, postSlug: true },
      });

      if (!parentComment || parentComment.postSlug !== validatedData.postSlug) {
        return NextResponse.json(
          { error: "Invalid parent comment" },
          { status: 400 }
        );
      }
    }

    // Create the comment
    const comment = await db.blogComment.create({
      data: {
        desc: validatedData.content,
        userEmail: session.user.email,
        postSlug: validatedData.postSlug,
        parentId: validatedData.parentId || null,
      },
      include: {
        user: {
          select: {
            username: true,
            image: true,
            encryptedFirstName: true,
            firstNameIV: true,
          },
        },
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    // Log to console (always happens)
    console.error("Error creating comment:", error);

    // Don't log Zod validation errors - they're expected client-side issues
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid comment data", details: error.errors },
        { status: 400 }
      );
    }

    // Log to database - user could email about "couldn't create comment"
    const userMessage = logError({
      code: "BLOG_COMMENT_CREATE_FAILED",
      userId: session?.user?.id,
      route: "/api/blog/comments",
      method: "POST",
      error,
      metadata: {
        postSlug: body?.postSlug,
        note: "Failed to create blog comment",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

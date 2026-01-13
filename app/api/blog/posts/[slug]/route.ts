import { NextRequest, NextResponse } from "next/server";
import { checkApiPermissions } from "@/lib/api-permissions";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let permissionCheck: any = null;
  // Extract slug from params immediately to avoid scope issues
  const slugParam = params.slug;
  let slug: string | undefined = slugParam;

  try {
    permissionCheck = await checkApiPermissions(["WRITE_BLOG"]);
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    // Normalize slug to lowercase - slugs are always stored in lowercase
    // This prevents case-sensitivity issues when users manually type URLs
    const normalizedSlug = slug.toLowerCase();

    // Get the blog post by slug and check if it belongs to the user
    const post = await db.blogPost.findUnique({
      where: { slug: normalizedSlug },
      select: {
        id: true,
        title: true,
        description: true,
        content: true,
        contentBlocks: true,
        catSlug: true,
        status: true,
        isPrivate: true,
        tags: true,
        keywords: true,
        readTime: true,
        img: true,
        metaTitle: true,
        metaDescription: true,
        userEmail: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    // Check if the post belongs to the user
    if (post.userEmail !== permissionCheck.user!.email) {
      return NextResponse.json(
        { error: "You can only edit your own blog posts" },
        { status: 403 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching blog post:", error);

    // Log to database - user could email about "can't load blog post"
    const userMessage = logError({
      code: "BLOG_POST_FETCH_FAILED",
      userId: permissionCheck?.user?.id,
      route: "/api/blog/posts/[slug]",
      method: "GET",
      error,
      metadata: {
        slug,
        note: "Failed to fetch blog post",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let permissionCheck: any = null;
  let body: any = null;
  let slug: string | undefined = undefined;

  try {
    permissionCheck = await checkApiPermissions(["WRITE_BLOG"]);
    slug = params.slug;
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    body = await request.json();
    const {
      title,
      description,
      content,
      contentBlocks,
      catSlug,
      status,
      isPrivate,
      tags,
      keywords,
      readTime,
      metaTitle,
      metaDescription,
    } = body;

    // Normalize slug to lowercase - slugs are always stored in lowercase
    const normalizedSlug = slug.toLowerCase();

    // First, get the blog post to check ownership
    const existingPost = await db.blogPost.findUnique({
      where: { slug: normalizedSlug },
      select: { id: true, userEmail: true },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    // Check if the post belongs to the user
    if (existingPost.userEmail !== permissionCheck.user!.email) {
      return NextResponse.json(
        { error: "You can only edit your own blog posts" },
        { status: 403 }
      );
    }

    // Generate new slug if title changed
    let newSlug = slug;
    if (title) {
      newSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Check if new slug already exists (excluding current post)
      if (newSlug !== normalizedSlug) {
        const slugExists = await db.blogPost.findUnique({
          where: { slug: newSlug },
        });

        if (slugExists) {
          return NextResponse.json(
            { error: "A blog post with this title already exists" },
            { status: 400 }
          );
        }
      }
    }

    // Update the blog post
    const updatedPost = await db.blogPost.update({
      where: { id: existingPost.id },
      data: {
        title,
        description,
        content,
        contentBlocks: contentBlocks || [],
        slug: newSlug,
        status,
        isPrivate,
        tags: tags || [],
        keywords: keywords || [],
        readTime,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        catSlug,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    // Log to console (always happens)
    console.error("Error updating blog post:", error);

    // Don't log validation errors - they're expected client-side issues

    // Log to database - user could email about "couldn't update blog post"
    const userMessage = logError({
      code: "BLOG_POST_UPDATE_FAILED",
      userId: permissionCheck?.user?.id,
      route: "/api/blog/posts/[slug]",
      method: "PUT",
      error,
      metadata: {
        slug,
        title: body?.title,
        note: "Failed to update blog post",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let permissionCheck: any = null;
  // Extract slug from params immediately to avoid scope issues
  const slugParam = params.slug;
  let slug: string | undefined = slugParam;

  try {
    permissionCheck = await checkApiPermissions(["WRITE_BLOG"]);
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    // Check if the post exists and belongs to the user
    const post = await db.blogPost.findUnique({
      where: { slug },
      select: { id: true, userEmail: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    if (post.userEmail !== permissionCheck.user!.email) {
      return NextResponse.json(
        { error: "You can only delete your own blog posts" },
        { status: 403 }
      );
    }

    // Delete the blog post
    await db.blogPost.delete({
      where: { id: post.id },
    });

    return NextResponse.json({ message: "Blog post deleted successfully" });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error deleting blog post:", error);

    // Log to database - user could email about "couldn't delete blog post"
    const userMessage = logError({
      code: "BLOG_POST_DELETE_FAILED",
      userId: permissionCheck?.user?.id,
      route: "/api/blog/posts/[slug]",
      method: "DELETE",
      error,
      metadata: {
        slug,
        note: "Failed to delete blog post",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

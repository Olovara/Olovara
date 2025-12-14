import { NextRequest, NextResponse } from "next/server";
import { checkApiPermissions } from "@/lib/api-permissions";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";

export async function POST(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let body: any = null;
  let permissionCheck: any = null;

  try {
    permissionCheck = await checkApiPermissions(["WRITE_BLOG"]);
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

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug already exists
    const existingPost = await db.blogPost.findUnique({
      where: { slug },
    });

    if (existingPost) {
      return NextResponse.json(
        { error: "A blog post with this title already exists" },
        { status: 400 }
      );
    }

    const blogPost = await db.blogPost.create({
      data: {
        title,
        description,
        content,
        contentBlocks: contentBlocks || [],
        slug,
        status,
        isPrivate,
        tags: tags || [],
        keywords: keywords || [],
        readTime,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        catSlug,
        userEmail: permissionCheck.user!.email!,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
    });

    return NextResponse.json(blogPost);
  } catch (error) {
    // Log to console (always happens)
    console.error("Error creating blog post:", error);

    // Don't log validation errors - they're expected client-side issues

    // Log to database - user could email about "couldn't create blog post"
    const userMessage = logError({
      code: "BLOG_POST_CREATE_FAILED",
      userId: permissionCheck?.user?.id,
      route: "/api/blog/posts",
      method: "POST",
      error,
      metadata: {
        title: body?.title,
        note: "Failed to create blog post",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let permissionCheck: any = null;

  try {
    permissionCheck = await checkApiPermissions(["WRITE_BLOG"]);
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    // Get user's blog posts
    const posts = await db.blogPost.findMany({
      where: {
        userEmail: permissionCheck.user!.email!,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        status: true,
        publishedAt: true,
        views: true,
        readTime: true,
        tags: true,
        metaTitle: true,
        metaDescription: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching blog posts:", error);

    // Log to database - user could email about "can't load my blog posts"
    const userMessage = logError({
      code: "BLOG_POSTS_FETCH_FAILED",
      userId: permissionCheck?.user?.id,
      route: "/api/blog/posts",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch blog posts",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

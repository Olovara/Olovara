import { NextRequest, NextResponse } from "next/server";
import { checkApiPermissions } from "@/lib/api-permissions";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const permissionCheck = await checkApiPermissions(['WRITE_BLOG']);
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const body = await request.json();
    const { title, description, content, catSlug, status, isPrivate, tags, keywords, readTime, metaTitle, metaDescription } = body;

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

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
    console.error("Error creating blog post:", error);
    return NextResponse.json(
      { error: "Failed to create blog post" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await checkApiPermissions(['WRITE_BLOG']);
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
        createdAt: 'desc',
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
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
} 
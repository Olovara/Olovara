import { NextRequest, NextResponse } from "next/server";
import { checkApiPermissions } from "@/lib/api-permissions";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const permissionCheck = await checkApiPermissions(["WRITE_BLOG"]);
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const { slug } = params;

    // Get the blog post by slug and check if it belongs to the user
    const post = await db.blogPost.findUnique({
      where: { slug },
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
    console.error("Error fetching blog post:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const permissionCheck = await checkApiPermissions(["WRITE_BLOG"]);
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const { slug } = params;
    const body = await request.json();
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

    // First, get the blog post to check ownership
    const existingPost = await db.blogPost.findUnique({
      where: { slug },
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
      if (newSlug !== slug) {
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
    console.error("Error updating blog post:", error);
    return NextResponse.json(
      { error: "Failed to update blog post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const permissionCheck = await checkApiPermissions(["WRITE_BLOG"]);
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const { slug } = params;

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
    console.error("Error deleting blog post:", error);
    return NextResponse.json(
      { error: "Failed to delete blog post" },
      { status: 500 }
    );
  }
}

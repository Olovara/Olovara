import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ROLES } from "@/data/roles-and-permissions";
import { createBlogPostSchema } from "@/schemas/BlogPostSchema";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== ROLES.ADMIN) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    
    // Validate request body using our comprehensive schema
    const validatedData = createBlogPostSchema.parse(body);

    // Check if category exists
    const category = await db.blogCategory.findUnique({
      where: { slug: validatedData.catSlug },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Generate slug from title
    const slug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug already exists
    const existingPost = await db.blogPost.findUnique({
      where: { slug },
    });

    if (existingPost) {
      return NextResponse.json(
        { error: "A post with this title already exists" },
        { status: 400 }
      );
    }

    // Calculate read time if not provided
    const readTime = validatedData.readTime || Math.ceil(validatedData.content.split(/\s+/).length / 200); // Assuming 200 words per minute

    // Create the blog post with all validated fields
    const post = await db.blogPost.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        content: validatedData.content,
        slug,
        catSlug: validatedData.catSlug,
        userEmail: session.user.email!,
        status: validatedData.status,
        isPrivate: validatedData.isPrivate,
        publishedAt: validatedData.status === "PUBLISHED" ? new Date() : null,
        readTime,
        img: validatedData.img,
        metaTitle: validatedData.metaTitle,
        metaDescription: validatedData.metaDescription,
        keywords: validatedData.keywords,
        canonicalUrl: validatedData.canonicalUrl,
        ogImage: validatedData.ogImage,
        ogTitle: validatedData.ogTitle,
        ogDescription: validatedData.ogDescription,
        authorName: validatedData.authorName,
        authorUrl: validatedData.authorUrl,
        tags: validatedData.tags,
        featured: validatedData.featured,
        allowComments: validatedData.allowComments,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error creating blog post:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Invalid request data", 
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
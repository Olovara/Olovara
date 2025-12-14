import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ROLES } from "@/data/roles-and-permissions";
import {
  createBlogCategorySchema,
  blogCategoryQuerySchema,
} from "@/schemas/BlogCategorySchema";
import { z } from "zod";
import { checkApiPermissions } from "@/lib/api-permissions";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

// GET: Fetch categories
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = {
      includeInactive: searchParams.get("includeInactive") === "true",
      parentSlug: searchParams.get("parentSlug") || undefined,
      search: searchParams.get("search") || undefined,
    };

    // Validate query parameters
    const validatedQuery = blogCategoryQuerySchema.parse(query);

    const categories = await db.blogCategory.findMany({
      where: {
        isActive: validatedQuery.includeInactive ? undefined : true,
        parentSlug: validatedQuery.parentSlug,
        ...(validatedQuery.search && {
          OR: [
            { title: { contains: validatedQuery.search, mode: "insensitive" } },
            {
              description: {
                contains: validatedQuery.search,
                mode: "insensitive",
              },
            },
          ],
        }),
      },
      orderBy: [{ order: "asc" }, { title: "asc" }],
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching blog categories:", error);

    // Don't log Zod validation errors - they're expected client-side issues
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: 400 }
      );
    }

    // Log to database - user could email about "can't load blog categories"
    const userMessage = logError({
      code: "BLOG_CATEGORIES_FETCH_FAILED",
      userId: undefined, // Public route
      route: "/api/blog/categories",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch blog categories",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

// POST: Create a new category
export async function POST(req: Request) {
  // Declare variables outside try block so they're accessible in catch
  let permissionCheck: any = null;
  let body: any = null;

  try {
    // Check permissions using centralized function
    permissionCheck = await checkApiPermissions(["MANAGE_CONTENT"]);

    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    body = await req.json();

    // Validate request body
    const validatedData = createBlogCategorySchema.parse(body);

    // Generate slug from title
    const slug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug already exists
    const existingCategory = await db.blogCategory.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "A category with this title already exists" },
        { status: 400 }
      );
    }

    // If parentSlug is provided, verify it exists
    if (validatedData.parentSlug) {
      const parentCategory = await db.blogCategory.findUnique({
        where: { slug: validatedData.parentSlug },
      });

      if (!parentCategory) {
        return NextResponse.json(
          { error: "Parent category not found" },
          { status: 404 }
        );
      }
    }

    // Create the category
    const category = await db.blogCategory.create({
      data: {
        title: validatedData.title,
        slug,
        description: validatedData.description,
        img: validatedData.img,
        parentSlug: validatedData.parentSlug,
        order: validatedData.order,
        isActive: validatedData.isActive,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    // Log to console (always happens)
    console.error("Error creating blog category:", error);

    // Don't log Zod validation errors - they're expected client-side issues
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    // Log to database - admin could email about "couldn't create blog category"
    const userMessage = logError({
      code: "BLOG_CATEGORY_CREATE_FAILED",
      userId: permissionCheck?.user?.id,
      route: "/api/blog/categories",
      method: "POST",
      error,
      metadata: {
        title: body?.title,
        note: "Failed to create blog category",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

// PUT: Update a category
export async function PUT(req: Request) {
  // Declare variables outside try block so they're accessible in catch
  let permissionCheck: any = null;
  let body: any = null;

  try {
    // Check permissions using centralized function
    permissionCheck = await checkApiPermissions(["MANAGE_CONTENT"]);

    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    body = await req.json();
    const { slug, ...updateData } = body;

    if (!slug) {
      return NextResponse.json(
        { error: "Category slug is required" },
        { status: 400 }
      );
    }

    // Validate update data
    const validatedData = createBlogCategorySchema.partial().parse(updateData);

    // Check if category exists
    const existingCategory = await db.blogCategory.findUnique({
      where: { slug },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // If updating parentSlug, verify it exists
    if (validatedData.parentSlug) {
      const parentCategory = await db.blogCategory.findUnique({
        where: { slug: validatedData.parentSlug },
      });

      if (!parentCategory) {
        return NextResponse.json(
          { error: "Parent category not found" },
          { status: 404 }
        );
      }

      // Prevent circular references
      if (validatedData.parentSlug === slug) {
        return NextResponse.json(
          { error: "Category cannot be its own parent" },
          { status: 400 }
        );
      }
    }

    // Update the category
    const updatedCategory = await db.blogCategory.update({
      where: { slug },
      data: validatedData,
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    // Log to console (always happens)
    console.error("Error updating blog category:", error);

    // Don't log Zod validation errors - they're expected client-side issues
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    // Log to database - admin could email about "couldn't update blog category"
    const userMessage = logError({
      code: "BLOG_CATEGORY_UPDATE_FAILED",
      userId: permissionCheck?.user?.id,
      route: "/api/blog/categories",
      method: "PUT",
      error,
      metadata: {
        slug: body?.slug,
        note: "Failed to update blog category",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

// DELETE: Delete a category
export async function DELETE(req: Request) {
  // Declare variables outside try block so they're accessible in catch
  let permissionCheck: any = null;
  let slug: string | null = null;

  try {
    // Check permissions using centralized function
    permissionCheck = await checkApiPermissions(["MANAGE_CONTENT"]);

    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const { searchParams } = new URL(req.url);
    slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Category slug is required" },
        { status: 400 }
      );
    }

    // Check if category exists
    const category = await db.blogCategory.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { posts: true, children: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if category has posts or subcategories
    if (category._count.posts > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with existing posts" },
        { status: 400 }
      );
    }

    if (category._count.children > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with subcategories" },
        { status: 400 }
      );
    }

    // Delete the category
    await db.blogCategory.delete({
      where: { slug },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error deleting blog category:", error);

    // Log to database - admin could email about "couldn't delete blog category"
    const userMessage = logError({
      code: "BLOG_CATEGORY_DELETE_FAILED",
      userId: permissionCheck?.user?.id,
      route: "/api/blog/categories",
      method: "DELETE",
      error,
      metadata: {
        slug,
        note: "Failed to delete blog category",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

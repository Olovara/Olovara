import { NextRequest, NextResponse } from "next/server";
import { checkApiPermissions } from "@/lib/api-permissions";
import { db } from "@/lib/db";
import { updateHelpCategorySchema } from "@/schemas/HelpCategorySchema";
import { logError } from "@/lib/error-logger";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let slug: string | undefined = undefined;

  try {
    slug = params.slug;

    const category = await db.helpCategory.findUnique({
      where: { slug },
      include: {
        articles: {
          where: {
            status: "PUBLISHED",
            isPrivate: false,
          },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            views: true,
            readTime: true,
            featured: true,
            order: true,
          },
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            articles: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Help category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching help category:", error);

    // Log to database - user could email about "can't load help category"
    const userMessage = logError({
      code: "HELP_CATEGORY_FETCH_FAILED",
      userId: undefined, // Public route
      route: "/api/help/categories/[slug]",
      method: "GET",
      error,
      metadata: {
        slug,
        note: "Failed to fetch help category",
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
  // Extract slug from params immediately to avoid scope issues
  const slugParam = params.slug;
  let slug: string | undefined = slugParam;

  try {
    permissionCheck = await checkApiPermissions(["MANAGE_HELP_CATEGORIES"]);
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    body = await request.json();

    // Validate request body
    const validation = updateHelpCategorySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { title, description, order, parentSlug, isActive } = validation.data;

    // Check if category exists
    const existingCategory = await db.helpCategory.findUnique({
      where: { slug: slug },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Help category not found" },
        { status: 404 }
      );
    }

    // Generate new slug if title changed
    let newSlug = slug;
    if (title && title !== existingCategory.title) {
      newSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Check if new slug already exists
      const slugExists = await db.helpCategory.findUnique({
        where: { slug: newSlug },
      });

      if (slugExists && slugExists.id !== existingCategory.id) {
        return NextResponse.json(
          { error: "A category with this title already exists" },
          { status: 400 }
        );
      }
    }

    // Update the category
    const updatedCategory = await db.helpCategory.update({
      where: { slug: slug },
      data: {
        title,
        description: description || "",
        order: order || 0,
        slug: newSlug,
        parentSlug: parentSlug || null,
        isActive: isActive ?? true,
      },
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    // Log to console (always happens)
    console.error("Error updating help category:", error);

    // Don't log validation errors - they're expected client-side issues

    // Log to database - admin could email about "couldn't update help category"
    const userMessage = logError({
      code: "HELP_CATEGORY_UPDATE_FAILED",
      userId: permissionCheck?.user?.id,
      route: "/api/help/categories/[slug]",
      method: "PUT",
      error,
      metadata: {
        slug,
        title: body?.title,
        note: "Failed to update help category",
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
    permissionCheck = await checkApiPermissions(["MANAGE_HELP_CATEGORIES"]);
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    // Check if category exists
    const category = await db.helpCategory.findUnique({
      where: { slug: slug },
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Help category not found" },
        { status: 404 }
      );
    }

    // Check if category has articles
    if (category._count.articles > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete category with existing articles. Please move or delete the articles first.",
        },
        { status: 400 }
      );
    }

    // Delete the category
    await db.helpCategory.delete({
      where: { slug: slug },
    });

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error deleting help category:", error);

    // Log to database - admin could email about "couldn't delete help category"
    const userMessage = logError({
      code: "HELP_CATEGORY_DELETE_FAILED",
      userId: permissionCheck?.user?.id,
      route: "/api/help/categories/[slug]",
      method: "DELETE",
      error,
      metadata: {
        slug,
        note: "Failed to delete help category",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

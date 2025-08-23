import { NextRequest, NextResponse } from "next/server";
import { checkApiPermissions } from "@/lib/api-permissions";
import { db } from "@/lib/db";
import { updateHelpCategorySchema } from "@/schemas/HelpCategorySchema";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

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
    console.error("Error fetching help category:", error);
    return NextResponse.json(
      { error: "Failed to fetch help category" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const permissionCheck = await checkApiPermissions(["MANAGE_HELP_CATEGORIES"]);
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const { slug } = params;
    const body = await request.json();
    
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
      where: { slug },
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
      where: { slug },
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
    console.error("Error updating help category:", error);
    return NextResponse.json(
      { error: "Failed to update help category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const permissionCheck = await checkApiPermissions(["MANAGE_HELP_CATEGORIES"]);
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const { slug } = params;

    // Check if category exists
    const category = await db.helpCategory.findUnique({
      where: { slug },
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
        { error: "Cannot delete category with existing articles. Please move or delete the articles first." },
        { status: 400 }
      );
    }

    // Delete the category
    await db.helpCategory.delete({
      where: { slug },
    });

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting help category:", error);
    return NextResponse.json(
      { error: "Failed to delete help category" },
      { status: 500 }
    );
  }
}

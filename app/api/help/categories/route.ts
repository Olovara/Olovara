import { NextRequest, NextResponse } from "next/server";
import { checkApiPermissions } from "@/lib/api-permissions";
import { db } from "@/lib/db";
import { createHelpCategorySchema } from "@/schemas/HelpCategorySchema";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Check permissions for help category management
    const permissionCheck = await checkApiPermissions(["MANAGE_HELP_CATEGORIES"]);
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }
    
    // Simple parameters
    const parentSlug = searchParams.get("parentSlug");
    const includeArticles = searchParams.get("includeArticles") === "true";
    const sortBy = searchParams.get("sortBy") || "order";
    const sortOrder = searchParams.get("sortOrder") || "asc";
    
    // Build where clause
    const where: any = {};
    if (parentSlug) {
      where.parentSlug = parentSlug;
    }
    
    // Build order by clause
    const orderBy: any = {};
    if (sortBy === "order") {
      orderBy.order = sortOrder;
    } else if (sortBy === "title") {
      orderBy.title = sortOrder;
    } else if (sortBy === "createdAt") {
      orderBy.createdAt = sortOrder;
    } else {
      orderBy.order = "asc"; // Default fallback
    }

    const categories = await db.helpCategory.findMany({
      where,
      orderBy,
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        order: true,
        isActive: true,
        _count: {
          select: {
            articles: {
              where: {
                status: "PUBLISHED",
                isPrivate: false,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching help categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch help categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const permissionCheck = await checkApiPermissions(["MANAGE_HELP_CATEGORIES"]);
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validation = createHelpCategorySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { title, description, order, parentSlug, isActive } = validation.data;

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug already exists
    const existingCategory = await db.helpCategory.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "A category with this title already exists" },
        { status: 400 }
      );
    }

    // Create the category
    const category = await db.helpCategory.create({
      data: {
        title,
        description: description || "",
        order: order || 0,
        slug,
        parentSlug: parentSlug || null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating help category:", error);
    return NextResponse.json(
      { error: "Failed to create help category" },
      { status: 500 }
    );
  }
}

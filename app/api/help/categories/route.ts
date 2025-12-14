import { NextRequest, NextResponse } from "next/server";
import { checkApiPermissions } from "@/lib/api-permissions";
import { db } from "@/lib/db";
import { createHelpCategorySchema } from "@/schemas/HelpCategorySchema";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let permissionCheck: any = null;

  try {
    const { searchParams } = new URL(request.url);

    // Check permissions for help category management
    permissionCheck = await checkApiPermissions(["MANAGE_HELP_CATEGORIES"]);
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
    // Log to console (always happens)
    console.error("Error fetching help categories:", error);

    // Log to database - admin could email about "can't load help categories"
    const userMessage = logError({
      code: "HELP_CATEGORIES_FETCH_FAILED",
      userId: permissionCheck?.user?.id,
      route: "/api/help/categories",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch help categories",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let permissionCheck: any = null;
  let body: any = null;

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
    // Log to console (always happens)
    console.error("Error creating help category:", error);

    // Don't log validation errors - they're expected client-side issues

    // Log to database - admin could email about "couldn't create help category"
    const userMessage = logError({
      code: "HELP_CATEGORY_CREATE_FAILED",
      userId: permissionCheck?.user?.id,
      route: "/api/help/categories",
      method: "POST",
      error,
      metadata: {
        title: body?.title,
        note: "Failed to create help category",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

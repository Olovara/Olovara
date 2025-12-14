import { NextRequest, NextResponse } from "next/server";
import { checkApiPermissions } from "@/lib/api-permissions";
import { db } from "@/lib/db";
import { createHelpArticleSchema } from "@/schemas/HelpArticleSchema";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let permissionCheck: any = null;

  try {
    const { searchParams } = new URL(request.url);

    // Check permissions for help article management
    permissionCheck = await checkApiPermissions(["WRITE_HELP_ARTICLES"]);
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    // Simple pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause for filtering
    const where: any = {};

    // Add filters if provided
    const status = searchParams.get("status");
    if (status && status !== "all") {
      where.status = status;
    }

    const category = searchParams.get("category");
    if (category && category !== "all") {
      where.catSlug = category;
    }

    const targetAudience = searchParams.get("targetAudience");
    if (targetAudience && targetAudience !== "all") {
      where.targetAudience = targetAudience;
    }

    const search = searchParams.get("search");
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search] } },
      ];
    }

    // Build order by clause
    const orderBy: any = {};
    if (sortBy === "createdAt") {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === "title") {
      orderBy.title = sortOrder;
    } else if (sortBy === "order") {
      orderBy.order = sortOrder;
    } else if (sortBy === "publishedAt") {
      orderBy.publishedAt = sortOrder;
    } else if (sortBy === "views") {
      orderBy.views = sortOrder;
    } else {
      orderBy.createdAt = "desc"; // Default fallback
    }

    const articles = await db.helpArticle.findMany({
      where,
      include: {
        cat: {
          select: {
            title: true,
            slug: true,
          },
        },
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
      orderBy,
      take: limit,
      skip: (page - 1) * limit,
    });

    const total = await db.helpArticle.count({ where });

    return NextResponse.json({
      articles,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching help articles:", error);

    // Log to database - admin could email about "can't load help articles"
    const userMessage = logError({
      code: "HELP_ARTICLES_FETCH_FAILED",
      userId: permissionCheck?.user?.id,
      route: "/api/help/articles",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch help articles",
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
    permissionCheck = await checkApiPermissions(["WRITE_HELP_ARTICLES"]);
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    body = await request.json();

    // Debug logging
    console.log("Received help article data:", JSON.stringify(body, null, 2));

    // Validate request body
    const validation = createHelpArticleSchema.safeParse(body);
    if (!validation.success) {
      console.error("Validation errors:", validation.error.errors);
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      contentBlocks,
      catSlug,
      status,
      isPrivate,
      targetAudience,
      tags,
      keywords,
      readTime,
      metaTitle,
      metaDescription,
      order,
    } = validation.data;

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug already exists
    const existingArticle = await db.helpArticle.findUnique({
      where: { slug },
    });

    if (existingArticle) {
      return NextResponse.json(
        { error: "An article with this title already exists" },
        { status: 400 }
      );
    }

    // Create the article
    const article = await db.helpArticle.create({
      data: {
        title,
        description,
        contentBlocks: contentBlocks || [],
        catSlug,
        status,
        isPrivate: isPrivate || false,
        targetAudience,
        tags: tags || [],
        keywords: keywords || [],
        readTime,
        metaTitle,
        metaDescription,
        order: order || 0,
        slug,
        userEmail: permissionCheck.user!.email!,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
      include: {
        cat: {
          select: {
            title: true,
            slug: true,
          },
        },
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error creating help article:", error);

    // Don't log validation errors - they're expected client-side issues

    // Log to database - admin could email about "couldn't create help article"
    const userMessage = logError({
      code: "HELP_ARTICLE_CREATE_FAILED",
      userId: permissionCheck?.user?.id,
      route: "/api/help/articles",
      method: "POST",
      error,
      metadata: {
        title: body?.title,
        note: "Failed to create help article",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { checkApiPermissions } from "@/lib/api-permissions";
import { db } from "@/lib/db";
import { createHelpArticleSchema } from "@/schemas/HelpArticleSchema";
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Check permissions for help article management
    const permissionCheck = await checkApiPermissions(["WRITE_HELP_ARTICLES"]);
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
    console.error("Error fetching help articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch help articles" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const permissionCheck = await checkApiPermissions(["WRITE_HELP_ARTICLES"]);
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validation = createHelpArticleSchema.safeParse(body);
    if (!validation.success) {
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
      img,
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
        img,
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
    console.error("Error creating help article:", error);
    return NextResponse.json(
      { error: "Failed to create help article" },
      { status: 500 }
    );
  }
}

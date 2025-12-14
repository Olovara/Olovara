import { NextRequest, NextResponse } from "next/server";
import { checkApiPermissions } from "@/lib/api-permissions";
import { db } from "@/lib/db";
import { updateHelpArticleSchema } from "@/schemas/HelpArticleSchema";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let slug: string | undefined = undefined;

  try {
    slug = params.slug;

    const article = await db.helpArticle.findUnique({
      where: { slug },
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

    if (!article) {
      return NextResponse.json(
        { error: "Help article not found" },
        { status: 404 }
      );
    }

    // Increment view count for published articles
    if (article.status === "PUBLISHED" && !article.isPrivate) {
      await db.helpArticle.update({
        where: { slug },
        data: { views: { increment: 1 } },
      });
    }

    return NextResponse.json(article);
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching help article:", error);

    // Log to database - user could email about "can't load help article"
    const userMessage = logError({
      code: "HELP_ARTICLE_FETCH_FAILED",
      userId: undefined, // Public route
      route: "/api/help/articles/[slug]",
      method: "GET",
      error,
      metadata: {
        slug,
        note: "Failed to fetch help article",
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
  let slug: string | undefined = undefined;

  try {
    permissionCheck = await checkApiPermissions(["WRITE_HELP_ARTICLES"]);
    slug = params.slug;
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    body = await request.json();

    // Validate request body
    const validation = updateHelpArticleSchema.safeParse(body);
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
      metaTitle,
      metaDescription,
      order,
    } = validation.data;

    // Check if article exists and user owns it
    const existingArticle = await db.helpArticle.findUnique({
      where: { slug },
    });

    if (!existingArticle) {
      return NextResponse.json(
        { error: "Help article not found" },
        { status: 404 }
      );
    }

    // For help articles, any admin with the correct permission can edit them
    // since they're all written by "The Yarnnu Team"

    // Generate new slug if title changed
    let newSlug = slug;
    if (title && title !== existingArticle.title) {
      newSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Check if new slug already exists
      const slugExists = await db.helpArticle.findUnique({
        where: { slug: newSlug },
      });

      if (slugExists && slugExists.id !== existingArticle.id) {
        return NextResponse.json(
          { error: "An article with this title already exists" },
          { status: 400 }
        );
      }
    }

    // Update the article
    const updatedArticle = await db.helpArticle.update({
      where: { slug },
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
        slug: newSlug,
        publishedAt:
          status === "PUBLISHED" && existingArticle.status !== "PUBLISHED"
            ? new Date()
            : existingArticle.publishedAt,
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

    return NextResponse.json(updatedArticle);
  } catch (error) {
    // Log to console (always happens)
    console.error("Error updating help article:", error);

    // Don't log validation errors - they're expected client-side issues

    // Log to database - admin could email about "couldn't update help article"
    const userMessage = logError({
      code: "HELP_ARTICLE_UPDATE_FAILED",
      userId: permissionCheck?.user?.id,
      route: "/api/help/articles/[slug]",
      method: "PUT",
      error,
      metadata: {
        slug,
        title: body?.title,
        note: "Failed to update help article",
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
    permissionCheck = await checkApiPermissions(["DELETE_HELP_ARTICLES"]);
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    // Check if article exists
    const article = await db.helpArticle.findUnique({
      where: { slug: slug },
    });

    if (!article) {
      return NextResponse.json(
        { error: "Help article not found" },
        { status: 404 }
      );
    }

    // For help articles, any admin with the correct permission can delete them
    // since they're all written by "The Yarnnu Team"

    // Delete the article
    await db.helpArticle.delete({
      where: { slug: slug },
    });

    return NextResponse.json({ message: "Article deleted successfully" });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error deleting help article:", error);

    // Log to database - admin could email about "couldn't delete help article"
    const userMessage = logError({
      code: "HELP_ARTICLE_DELETE_FAILED",
      userId: permissionCheck?.user?.id,
      route: "/api/help/articles/[slug]",
      method: "DELETE",
      error,
      metadata: {
        slug,
        note: "Failed to delete help article",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

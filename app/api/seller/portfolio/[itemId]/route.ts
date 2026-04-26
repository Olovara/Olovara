import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UTApi } from "uploadthing/server";
import { hasPermission } from "@/lib/permissions";
import type { Permission } from "@/data/roles-and-permissions";
import { logError } from "@/lib/error-logger";
import {
  PortfolioItemUpdateSchema,
  PortfolioFeaturedSchema,
} from "@/schemas/PortfolioItemSchema";

export const dynamic = "force-dynamic";

const utapi = new UTApi();

const ParamsSchema = z.object({
  itemId: z.string().min(1),
});

const MAX_FEATURED = 4;

async function requireManagePermission(sessionUserId: string) {
  const canManage = await hasPermission(
    sessionUserId,
    "MANAGE_SELLER_SETTINGS" as Permission
  );
  return canManage;
}

async function assignNextFeaturedRank(sellerId: string): Promise<number | null> {
  const featuredItems = await db.portfolioItem.findMany({
    where: { sellerId, featured: true },
    select: { featuredRank: true },
  });
  const used = new Set(
    featuredItems
      .map((i) => i.featuredRank)
      .filter((v): v is number => typeof v === "number")
  );
  for (let r = 0; r < MAX_FEATURED; r += 1) {
    if (!used.has(r)) return r;
  }
  return null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  let session: any = null;
  try {
    session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const { itemId } = ParamsSchema.parse(await params);

    const item = await db.portfolioItem.findFirst({
      where: { id: itemId, sellerId: session.user.id },
    });
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("[seller/portfolio/:itemId] GET error", error);
    const userMessage = logError({
      code: "SELLER_PORTFOLIO_ITEM_GET_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/portfolio/[itemId]",
      method: "GET",
      error,
    });
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  let session: any = null;
  try {
    session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const canManage = await requireManagePermission(session.user.id);
    if (!canManage) {
      return NextResponse.json(
        { error: "You don't have permission to perform this action." },
        { status: 403 }
      );
    }

    const { itemId } = ParamsSchema.parse(await params);
    const body = await req.json();

    // Allow a small "featured toggle" payload too.
    const featuredParsed = PortfolioFeaturedSchema.safeParse(body);
    if (featuredParsed.success) {
      const owned = await db.portfolioItem.findFirst({
        where: { id: itemId, sellerId: session.user.id },
        select: { id: true, featured: true },
      });
      if (!owned) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      if (featuredParsed.data.featured) {
        const featuredCount = await db.portfolioItem.count({
          where: { sellerId: session.user.id, featured: true },
        });
        if (featuredCount >= MAX_FEATURED) {
          return NextResponse.json(
            { error: `You can only pin ${MAX_FEATURED} items.` },
            { status: 400 }
          );
        }
      }

      const nextRank = featuredParsed.data.featured
        ? featuredParsed.data.featuredRank ?? (await assignNextFeaturedRank(session.user.id))
        : null;

      const updated = await db.portfolioItem.update({
        where: { id: itemId },
        data: {
          featured: featuredParsed.data.featured,
          featuredRank: featuredParsed.data.featured ? nextRank : null,
        },
      });

      return NextResponse.json({ item: updated });
    }

    const data = PortfolioItemUpdateSchema.parse(body);

    // Enforce max featured (if turning on)
    if (data.featured === true) {
      const featuredCount = await db.portfolioItem.count({
        where: { sellerId: session.user.id, featured: true },
      });
      const isAlreadyFeatured = await db.portfolioItem.findFirst({
        where: { id: itemId, sellerId: session.user.id, featured: true },
        select: { id: true },
      });
      if (!isAlreadyFeatured && featuredCount >= MAX_FEATURED) {
        return NextResponse.json(
          { error: `You can only pin ${MAX_FEATURED} items.` },
          { status: 400 }
        );
      }
    }

    const owned = await db.portfolioItem.findFirst({
      where: { id: itemId, sellerId: session.user.id },
      select: { id: true, featured: true },
    });
    if (!owned) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let featuredRank: number | null | undefined = undefined;
    if (data.featured === false) featuredRank = null;
    if (data.featured === true && data.featuredRank == null) {
      featuredRank = await assignNextFeaturedRank(session.user.id);
    }
    if (typeof data.featuredRank !== "undefined") {
      featuredRank = data.featuredRank;
    }

    const updated = await db.portfolioItem.update({
      where: { id: itemId },
      data: {
        title: data.title,
        images: data.images,
        tags: data.tags,
        description: data.description,
        priceRange: data.priceRange,
        complexity: data.complexity,
        featured: data.featured,
        featuredRank,
        sortOrder: data.sortOrder,
      },
    });

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error("[seller/portfolio/:itemId] PUT error", error);
    const userMessage = logError({
      code: "SELLER_PORTFOLIO_ITEM_UPDATE_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/portfolio/[itemId]",
      method: "PUT",
      error,
    });
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  let session: any = null;
  try {
    session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const canManage = await requireManagePermission(session.user.id);
    if (!canManage) {
      return NextResponse.json(
        { error: "You don't have permission to perform this action." },
        { status: 403 }
      );
    }

    const { itemId } = ParamsSchema.parse(await params);

    const owned = await db.portfolioItem.findFirst({
      where: { id: itemId, sellerId: session.user.id },
      select: { id: true, images: true },
    });
    if (!owned) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const removedImages = Array.isArray(owned.images) ? owned.images : [];
    const removedFileKeys = removedImages
      .map((url) => url?.substring(url.lastIndexOf("/") + 1))
      .filter(Boolean);

    await db.portfolioItem.delete({ where: { id: itemId } });

    if (removedFileKeys.length > 0) {
      try {
        await utapi.deleteFiles(removedFileKeys);
        await db.temporaryUpload.deleteMany({
          where: {
            fileUrl: { in: removedImages },
            userId: session.user.id,
          },
        });
      } catch (deleteError) {
        // Don't block the UI for cleanup failures, but log them.
        logError({
          code: "PORTFOLIO_ITEM_FILE_DELETE_FAILED",
          userId: session.user.id,
          route: "/api/seller/portfolio/[itemId]",
          method: "DELETE",
          error: deleteError,
          metadata: {
            itemId,
            removedImages,
            removedFileKeys,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[seller/portfolio/:itemId] DELETE error", error);
    const userMessage = logError({
      code: "SELLER_PORTFOLIO_ITEM_DELETE_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/portfolio/[itemId]",
      method: "DELETE",
      error,
    });
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}


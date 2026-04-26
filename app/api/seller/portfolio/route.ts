import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import type { Permission } from "@/data/roles-and-permissions";
import { logError } from "@/lib/error-logger";
import {
  PortfolioItemCreateSchema,
  PortfolioReorderSchema,
} from "@/schemas/PortfolioItemSchema";

export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  sellerId: z.string().optional(), // admin override
});

const MAX_ITEMS_PER_SELLER = 24;
const MAX_FEATURED = 4;

async function resolveTargetSellerId(sessionUserId: string, sellerId?: string) {
  if (!sellerId || sellerId === sessionUserId) return sessionUserId;

  const canManage = await hasPermission(
    sessionUserId,
    "MANAGE_SELLER_SETTINGS" as Permission
  );
  if (!canManage) return sessionUserId;
  return sellerId;
}

export async function GET(req: Request) {
  let session: any = null;
  try {
    session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(req.url);
    const parsed = QuerySchema.parse({
      sellerId: url.searchParams.get("sellerId") || undefined,
    });
    const targetSellerId = await resolveTargetSellerId(
      session.user.id,
      parsed.sellerId
    );

    const items = await db.portfolioItem.findMany({
      where: { sellerId: targetSellerId },
      orderBy: [
        { featured: "desc" },
        { featuredRank: "asc" },
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[seller/portfolio] GET error", error);
    const userMessage = logError({
      code: "SELLER_PORTFOLIO_GET_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/portfolio",
      method: "GET",
      error,
    });
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let session: any = null;
  try {
    session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const canManage = await hasPermission(
      session.user.id,
      "MANAGE_SELLER_SETTINGS" as Permission
    );
    if (!canManage) {
      return NextResponse.json(
        { error: "You don't have permission to perform this action." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = PortfolioItemCreateSchema.parse(body);

    const existingCount = await db.portfolioItem.count({
      where: { sellerId: session.user.id },
    });
    if (existingCount >= MAX_ITEMS_PER_SELLER) {
      return NextResponse.json(
        { error: `Portfolio limit reached (max ${MAX_ITEMS_PER_SELLER}).` },
        { status: 400 }
      );
    }

    let featuredRank: number | null = null;
    let featured = !!data.featured;

    if (featured) {
      const featuredCount = await db.portfolioItem.count({
        where: { sellerId: session.user.id, featured: true },
      });
      if (featuredCount >= MAX_FEATURED) {
        featured = false;
      } else {
        // Assign the next available rank 0..3
        const featuredItems = await db.portfolioItem.findMany({
          where: { sellerId: session.user.id, featured: true },
          select: { featuredRank: true },
        });
        const used = new Set(
          featuredItems
            .map((i) => i.featuredRank)
            .filter((v): v is number => typeof v === "number")
        );
        for (let r = 0; r < MAX_FEATURED; r += 1) {
          if (!used.has(r)) {
            featuredRank = r;
            break;
          }
        }
      }
    }

    const maxSort = await db.portfolioItem.findFirst({
      where: { sellerId: session.user.id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const item = await db.portfolioItem.create({
      data: {
        sellerId: session.user.id,
        title: data.title,
        images: data.images,
        tags: data.tags,
        description: data.description,
        priceRange: data.priceRange,
        complexity: data.complexity,
        featured,
        featuredRank,
        sortOrder: (maxSort?.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("[seller/portfolio] POST error", error);
    const userMessage = logError({
      code: "SELLER_PORTFOLIO_CREATE_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/portfolio",
      method: "POST",
      error,
    });
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

/**
 * PATCH /api/seller/portfolio
 * Bulk reorder (non-featured ordering).
 */
export async function PATCH(req: Request) {
  let session: any = null;
  try {
    session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const canManage = await hasPermission(
      session.user.id,
      "MANAGE_SELLER_SETTINGS" as Permission
    );
    if (!canManage) {
      return NextResponse.json(
        { error: "You don't have permission to perform this action." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = PortfolioReorderSchema.parse(body);

    const ids = data.order.map((o) => o.id);
    const ownedCount = await db.portfolioItem.count({
      where: { sellerId: session.user.id, id: { in: ids } },
    });
    if (ownedCount !== ids.length) {
      return NextResponse.json({ error: "Invalid items." }, { status: 400 });
    }

    await db.$transaction(
      data.order.map((o) =>
        db.portfolioItem.update({
          where: { id: o.id },
          data: { sortOrder: o.sortOrder },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[seller/portfolio] PATCH error", error);
    const userMessage = logError({
      code: "SELLER_PORTFOLIO_REORDER_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/portfolio",
      method: "PATCH",
      error,
    });
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}


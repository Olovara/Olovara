import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";

export const dynamic = "force-dynamic";

const ParamsSchema = z.object({
  shopNameSlug: z.string().min(1),
});

/**
 * Public seller portfolio feed for buyers.
 * Returns featured items first (ranked), then remaining by sortOrder.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ shopNameSlug: string }> }
) {
  try {
    const { shopNameSlug } = ParamsSchema.parse(await params);

    const seller = await db.seller.findUnique({
      where: { shopNameSlug },
      select: { userId: true },
    });
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const items = await db.portfolioItem.findMany({
      where: { sellerId: seller.userId },
      orderBy: [
        { featured: "desc" },
        { featuredRank: "asc" },
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[sellers/:shopNameSlug/portfolio] GET error", error);
    const userMessage = logError({
      code: "PUBLIC_SELLER_PORTFOLIO_GET_FAILED",
      userId: null,
      route: "/api/sellers/[shopNameSlug]/portfolio",
      method: "GET",
      error,
    });
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}


import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import type { Permission } from "@/data/roles-and-permissions";
import { logError } from "@/lib/error-logger";

export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  scope: z.string().optional(), // reserved for future (billing/shipping/etc)
  sellerId: z.string().optional(), // admin override
});

/**
 * Minimal endpoint for UI gating:
 * - "Can this seller enable carrier auto shipping?" → requires default business address.
 *
 * We do NOT return decrypted address here; just a boolean.
 */
export async function GET(req: Request) {
  let session: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(req.url);
    const parsed = QuerySchema.parse({
      scope: url.searchParams.get("scope") || undefined,
      sellerId: url.searchParams.get("sellerId") || undefined,
    });

    let targetSellerUserId = session.user.id;

    if (parsed.sellerId && parsed.sellerId !== session.user.id) {
      const canCreateForSellers = await hasPermission(
        session.user.id,
        "CREATE_PRODUCTS_FOR_SELLERS" as Permission,
      );
      if (canCreateForSellers) {
        targetSellerUserId = parsed.sellerId;
      }
    }

    const addr = await db.address.findFirst({
      where: {
        sellerId: targetSellerUserId,
        isDefault: true,
        isBusinessAddress: true,
      },
      select: { id: true },
    });

    return NextResponse.json({
      hasDefaultBusinessAddress: !!addr,
    });
  } catch (error) {
    console.error("[seller/addresses] error", error);
    const userMessage = logError({
      code: "SELLER_ADDRESSES_LOOKUP_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/addresses",
      method: "GET",
      error,
    });
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}


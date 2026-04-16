import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCountryByCode } from "@/data/countries";

// This route depends on DB access. Mark as dynamic so Next doesn't try to prerender it.
export const dynamic = "force-dynamic";

/**
 * GET /api/shops/seller-countries
 * Returns distinct country codes (shopCountry) for accepted shops (sellers).
 * Used by the shops page filters for "Seller location".
 */
export async function GET() {
  try {
    const sellers = await db.seller.findMany({
      where: {
        applicationAccepted: true,
        NOT: {
          shopName: {
            contains: "Temporary Shop",
          },
        },
      },
      select: { shopCountry: true },
    });

    const countryCodes = sellers
      .map((s) => s.shopCountry?.trim())
      .filter(Boolean) as string[];

    const unique = Array.from(new Set(countryCodes));

    const sorted = unique.sort((a, b) => {
      const nameA = getCountryByCode(a)?.name ?? a;
      const nameB = getCountryByCode(b)?.name ?? b;
      return nameA.localeCompare(nameB);
    });

    return NextResponse.json({ countries: sorted });
  } catch (error) {
    console.error("Error fetching shop seller countries:", error);
    return NextResponse.json(
      { countries: [] },
      { status: 500 }
    );
  }
}

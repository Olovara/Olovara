import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCountryByCode } from "@/data/countries";

/**
 * GET /api/products/seller-countries
 * Returns distinct country codes (shopCountry) for sellers who have at least one ACTIVE product.
 * Optional: ?category=PRIMARY_CATEGORY to limit to that category.
 * Used by the product filters to show "Seller location" options.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;

    const sellers = await db.seller.findMany({
      where: {
        products: {
          some: {
            status: "ACTIVE",
            ...(category ? { primaryCategory: category.toUpperCase() } : {}),
          },
        },
      },
      select: { shopCountry: true },
    });

    const countryCodes = sellers
      .map((s) => s.shopCountry?.trim())
      .filter(Boolean) as string[];

    const unique = Array.from(new Set(countryCodes));

    // Sort by country name for display
    const sorted = unique.sort((a, b) => {
      const nameA = getCountryByCode(a)?.name ?? a;
      const nameB = getCountryByCode(b)?.name ?? b;
      return nameA.localeCompare(nameB);
    });

    return NextResponse.json({ countries: sorted });
  } catch (error) {
    console.error("Error fetching seller countries:", error);
    return NextResponse.json(
      { countries: [] },
      { status: 500 }
    );
  }
}

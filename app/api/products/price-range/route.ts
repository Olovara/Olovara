import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserCountryCode } from "@/actions/locationFilterActions";
import { createProductFilterWhereClause, getProductFilterConfig } from "@/lib/product-filtering";

// This route depends on request.url and DB access.
// Mark as dynamic so Next doesn't try to prerender it during build/export.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;

    // Get user's country code for location-based filtering
    const userCountryCode = await getUserCountryCode();
    // Get centralized filter configuration
    const filterConfig = await getProductFilterConfig(userCountryCode || undefined);
    
    // Normalize category to uppercase if provided - categories are stored in uppercase in DB
    // This prevents case-sensitivity issues when category comes from URL params
    const normalizedCategory = category ? category.toUpperCase() : undefined;
    
    // Build additional filters
    const additionalFilters = normalizedCategory ? { primaryCategory: normalizedCategory } : {};
    // Use centralized filtering
    const where = await createProductFilterWhereClause(additionalFilters, filterConfig);

    const [minProduct, maxProduct] = await Promise.all([
      db.product.findFirst({
        where,
        orderBy: { price: "asc" },
        select: { price: true, currency: true },
      }),
      db.product.findFirst({
        where,
        orderBy: { price: "desc" },
        select: { price: true, currency: true },
      }),
    ]);

    const min = minProduct?.price ?? 0;
    const max = maxProduct?.price ?? 100000;
    const minCurrency = minProduct?.currency ?? "USD";
    const maxCurrency = maxProduct?.currency ?? "USD";

    return NextResponse.json({
      min,
      max,
      minCurrency,
      maxCurrency,
    });
  } catch (error) {
    console.error("Error fetching price range:", error);
    return NextResponse.json(
      { min: 0, max: 100000, minCurrency: "USD", maxCurrency: "USD" },
      { status: 500 }
    );
  }
}

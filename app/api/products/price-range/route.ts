import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserCountryCode } from "@/actions/locationFilterActions";
import { createProductFilterWhereClause, getProductFilterConfig } from "@/lib/product-filtering";

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

    const [minPrice, maxPrice] = await Promise.all([
      db.product.findFirst({
        where,
        orderBy: { price: "asc" },
        select: { price: true },
      }),
      db.product.findFirst({
        where,
        orderBy: { price: "desc" },
        select: { price: true },
      }),
    ]);

    return NextResponse.json({
      min: minPrice?.price || 0, // Return in cents (component expects cents)
      max: maxPrice?.price || 100000, // Return in cents (component expects cents)
    });
  } catch (error) {
    console.error("Error fetching price range:", error);
    return NextResponse.json(
      { min: 0, max: 100000 },
      { status: 500 }
    );
  }
}

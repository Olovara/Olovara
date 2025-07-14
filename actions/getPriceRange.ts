"use server";

import { db } from "@/lib/db";
import { getUserCountryCode } from "@/actions/locationFilterActions";
import { createProductFilterWhereClause, getProductFilterConfig } from "@/lib/product-filtering";

export async function getPriceRange(category?: string) {
  try {
    // Get user's country code for location-based filtering
    const userCountryCode = await getUserCountryCode();
    // Get centralized filter configuration
    const filterConfig = await getProductFilterConfig(userCountryCode || undefined);
    // Build additional filters
    const additionalFilters = category ? { primaryCategory: category } : {};
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

    return {
      min: minPrice?.price || 0,
      max: maxPrice?.price || 1000,
    };
  } catch (error) {
    console.error("Error fetching price range:", error);
    return { min: 0, max: 1000 };
  }
} 
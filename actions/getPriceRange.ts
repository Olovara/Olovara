"use server";

import { db } from "@/lib/db";

export async function getPriceRange(category?: string) {
  try {
    const where = {
      status: "ACTIVE",
      ...(category ? { primaryCategory: category } : {}),
    };

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
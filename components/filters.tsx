"use client";

import ProductFilters from "@/components/ProductFilters";

export interface SearchParams {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
}

export function Filters() {
  return <ProductFilters />;
} 
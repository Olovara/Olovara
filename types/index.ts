export interface SearchParams {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
}
export interface ProductFilters {
  priceRange: [number, number];
  category: string[];
  orderBy: "updatedAt_desc" | "price_asc" | "price_desc";
}
import { ZodIssue } from "zod";

type ActionResult<T> =
  | { status: "success"; data: T }
  | { status: "error"; error: string | ZodIssue[] };

export interface ProductFilters {
  priceRange: [number, number];
  category: string[];
  orderBy: "updatedAt_desc" | "price_asc" | "price_desc";
}

type PaginatedResponse<T> = {
  items: T[];
  totalCount: number;
};

type PagingParams = {
  pageNumber: number;
  pageSize: number;
};

type PagingResult = {
  totalPages: number;
  totalCount: number;
} & PagingParams;

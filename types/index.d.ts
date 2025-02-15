import { ZodIssue } from "zod";

type ActionResult<T> =
    { status: 'success', data: T } | { status: 'error', error: string | ZodIssue[] }

type ProductFilters = {
    priceRange: number[];
    category: string[];
    orderBy: string;
}

type PaginatedResponse<T> = {
    items: T[];
    totalCount: number;
}

type PagingParams = {
    pageNumber: number;
    pageSize: number;
}

type PagingResult = {
    totalPages: number;
    totalCount: number;
} & PagingParams
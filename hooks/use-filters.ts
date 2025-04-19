import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import usePaginationStore from "./use-pagination-store";
import useFilterStore from "./use-filter-store";
import { CategoriesMap } from "@/data/categories";

interface UseFiltersProps {
  initialCategory?: string;  // Optional initial category for category pages
  showPriceFilter?: boolean;
  showCategoryFilter?: boolean;
  showOrderFilter?: boolean;
}

export const useFilters = ({
  initialCategory,
  showPriceFilter = true,
  showCategoryFilter = true,
  showOrderFilter = true,
}: UseFiltersProps = {}) => {
  const pathname = usePathname();
  const router = useRouter();

  const { filters, setFilters, resetFilters } = useFilterStore();
  const {
    pagination: { pageNumber, pageSize, totalCount },
    setPage,
  } = usePaginationStore();

  const { category, priceRange, orderBy } = filters;
  const [isPending, startTransition] = useTransition();

  // Set initial category if provided
  useEffect(() => {
    if (initialCategory && !category.includes(initialCategory)) {
      setFilters("category", [initialCategory]);
    }
  }, [initialCategory]);

  // Reset filters when leaving the page
  useEffect(() => {
    return () => {
      if (!initialCategory) resetFilters();
    };
  }, []);

  useEffect(() => {
    if (category || priceRange || orderBy) {
      setPage(1);
    }
  }, [category, priceRange, orderBy, setPage]);

  useEffect(() => {
    startTransition(() => {
      const searchParams = new URLSearchParams();

      if (category.length > 0) searchParams.set("category", category.join(","));
      if (priceRange) searchParams.set("priceRange", priceRange.toString());
      if (orderBy) searchParams.set("orderBy", orderBy);
      if (pageSize) searchParams.set("pageSize", pageSize.toString());
      if (pageNumber) searchParams.set("pageNumber", pageNumber.toString());

      router.replace(`${pathname}?${searchParams}`);
    });
  }, [priceRange, orderBy, category, router, pathname, pageNumber, pageSize]);

  const orderByList = [
    { label: "Newest", value: "updatedAt_desc" },
    { label: "Oldest", value: "updatedAt_asc" },
    { label: "Price (Low to High)", value: "price_asc" },
    { label: "Price (High to Low)", value: "price_desc" },
  ];

  const categoryList = CategoriesMap.PRIMARY.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  const handlePriceSelect = (value: number[]) => {
    setFilters("priceRange", value);
  };

  const handleOrderSelect = (value: string) => {
    setFilters("orderBy", value);
  };

  const handleCategorySelect = (value: string) => {
    if (category.includes(value))
      setFilters("category", category.filter((v) => v !== value));
    else
      setFilters("category", [...category, value]);
  };

  return {
    orderByList,
    categoryList,
    selectPrice: handlePriceSelect,
    selectCategory: handleCategorySelect,
    selectOrder: handleOrderSelect,
    filters,
    totalCount,
    isPending,
    showPriceFilter,
    showCategoryFilter,
    showOrderFilter,
  };
};

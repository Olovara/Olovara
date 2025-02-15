import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, ChangeEvent, useTransition } from "react";
import usePaginationStore from "./use-pagination-store";
import useFilterStore from "./use-filter-store";
import { CategoriesMap } from "@/data/categories";

export const useFilters = () => {
  const pathname = usePathname();
  const router = useRouter();

  const { filters, setFilters } = useFilterStore();

  const { pageNumber, pageSize, setPage, totalCount } = usePaginationStore(
    (state) => ({
      pageNumber: state.pagination.pageNumber,
      pageSize: state.pagination.pageSize,
      setPage: state.setPage,
      totalCount: state.pagination.totalCount,
    })
  );

  const { category, priceRange, orderBy } = filters;

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (category || priceRange || orderBy) {
      setPage(1);
    }
  }, [category, priceRange, orderBy, setPage]);

  useEffect(() => {
    startTransition(() => {
      const searchParams = new URLSearchParams();

      if (category) searchParams.set("gender", category.join(","));
      if (priceRange) searchParams.set("priceRange", priceRange.toString());
      if (orderBy) searchParams.set("orderBy", orderBy);
      if (pageSize) searchParams.set("pageSize", pageSize.toString());
      if (pageNumber) searchParams.set("pageNumber", pageNumber.toString());

      router.replace(`${pathname}?${searchParams}`);
    });
  }, [
    priceRange,
    orderBy,
    category,
    router,
    pathname,
    pageNumber,
    pageSize,
  ]);

  const orderByList = [
    { label: "Lowest Price", value: "updated" },
    { label: "Highest Price", value: "created" },
    { label: "Newest", value: "created" },
  ];

  const categoryList = CategoriesMap.PRIMARY.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  const handlePriceSelect = (value: number[]) => {
    setFilters("priceRange", value);
  };

  const handleOrderSelect = (value: Selection) => {
    if (value instanceof Set) {
      setFilters("orderBy", value.values().next().value);
    }
  };

  const handleCategorySelect = (value: string) => {
    if (category.includes(value))
      setFilters(
        "category",
        category.filter((categoryValue) => categoryValue !== value)
      );
    else setFilters("category", [...category, value]);
  };

  return {
    orderByList,
    categoryList,
    selectPrice: handlePriceSelect,
    selectGender: handleCategorySelect,
    selectOrder: handleOrderSelect,
    filters,
    totalCount,
    isPending,
  };
};

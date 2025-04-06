import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface PaginationState {
  pagination: {
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
  };
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setPagination: (totalCount: number) => void;
}

const usePaginationStore = create<PaginationState>()(
  devtools(
    (set) => ({
      pagination: {
        pageNumber: 1,
        pageSize: 24,
        totalPages: 1,
        totalCount: 0,
      },
      setPage: (page) =>
        set((state) => ({
          pagination: {
            ...state.pagination,
            pageNumber: page,
          },
        })),
      setPageSize: (size) =>
        set((state) => ({
          pagination: {
            ...state.pagination,
            pageSize: size,
            pageNumber: 1, // Reset to first page when changing page size
          },
        })),
      setPagination: (totalCount) =>
        set((state) => ({
          pagination: {
            ...state.pagination,
            totalCount,
            totalPages: Math.ceil(totalCount / state.pagination.pageSize),
          },
        })),
    }),
    { name: "paginationStore" }
  )
);

export default usePaginationStore;

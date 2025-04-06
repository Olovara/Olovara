"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import clsx from "clsx";
import usePaginationStore from "@/hooks/use-pagination-store";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Shared page size button component
const PageSizeButton = ({ size, currentSize, onClick }: { 
  size: number; 
  currentSize: number; 
  onClick: (size: number) => void;
}) => (
  <div
    onClick={() => onClick(size)}
    className={clsx(
      "cursor-pointer px-2 py-1 rounded border text-sm transition-colors",
      {
        "bg-foreground text-white": currentSize === size,
        "hover:bg-muted": currentSize !== size,
      }
    )}
  >
    {size}
  </div>
);

// Top section: "Showing X–Y of Z results" + page size
export function PaginationInfoAndSizeSelector({
  totalCount,
  pageNumber,
  pageSize,
}: {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { setPageSize } = usePaginationStore();

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("pageSize", size.toString());
    searchParams.set("pageNumber", "1"); // Reset to first page when changing page size
    router.push(`${pathname}?${searchParams.toString()}`);
  };

  const start = (pageNumber - 1) * pageSize + 1;
  const end = Math.min(pageNumber * pageSize, totalCount);
  const resultText = `Showing ${start}-${end} of ${totalCount} results`;

  return (
    <div className="flex flex-wrap justify-between items-center py-4">
      <div>{resultText}</div>
      <div className="flex items-center gap-1">
        Page size:
        {[24, 48, 96].map((size) => (
          <PageSizeButton
            key={size}
            size={size}
            currentSize={pageSize}
            onClick={handlePageSizeChange}
          />
        ))}
      </div>
    </div>
  );
}

// Bottom section: Pagination controls + page size
export function PaginationControlsAndSizeSelector({
  totalCount,
  pageNumber,
  pageSize,
  totalPages,
}: {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { setPage, setPageSize } = usePaginationStore();

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set("pageNumber", newPage.toString());
      router.push(`${pathname}?${searchParams.toString()}`);
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("pageSize", size.toString());
    searchParams.set("pageNumber", "1");
    router.push(`${pathname}?${searchParams.toString()}`);
  };

  return (
    <div className="border-t-2 w-full mt-5">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-5">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pageNumber - 1)}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === pageNumber ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pageNumber + 1)}
            disabled={pageNumber >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-1">
          Page size:
          {[24, 48, 96].map((size) => (
            <PageSizeButton
              key={size}
              size={size}
              currentSize={pageSize}
              onClick={handlePageSizeChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

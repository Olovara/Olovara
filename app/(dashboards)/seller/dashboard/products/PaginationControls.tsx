"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

interface PaginationControlsProps {
  totalPages: number;
  currentPage: number;
  totalItems: number;
  pageSize: number;
  activeTab: string;
  searchQuery: string;
}

export function PaginationControls({
  totalPages,
  currentPage,
  totalItems,
  pageSize,
  activeTab,
  searchQuery,
}: PaginationControlsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const startItem =
    totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem =
    totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems);

  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    if (activeTab) params.set("tab", activeTab);
    if (searchQuery) params.set("search", searchQuery);
    return `${pathname}?${params.toString()}`;
  };

  const summary =
    totalItems === 0 ? (
      <span>Showing 0 of 0 items</span>
    ) : (
      <span>
        Showing {startItem}-{endItem} of {totalItems} items
      </span>
    );

  if (totalPages <= 1) {
    return (
      <div className="mt-4 w-full border-t border-brand-dark-neutral-200 pt-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{summary}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 w-full border-t border-brand-dark-neutral-200 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">{summary}</div>
        <div className="flex items-center space-x-2">
          {currentPage > 1 ? (
            <Link href={getPageUrl(currentPage - 1)}>
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous Page</span>
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous Page</span>
            </Button>
          )}

          <div className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>

          {currentPage < totalPages ? (
            <Link href={getPageUrl(currentPage + 1)}>
              <Button variant="outline" size="sm">
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next Page</span>
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next Page</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SuspendedPaginationControls(
  props: PaginationControlsProps
) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaginationControls {...props} />
    </Suspense>
  );
}

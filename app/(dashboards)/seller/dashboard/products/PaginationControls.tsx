"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

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

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    if (activeTab) params.set("tab", activeTab);
    if (searchQuery) params.set("search", searchQuery);
    return `${pathname}?${params.toString()}`;
  };

  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {startItem}-{endItem} of {totalItems} items
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {startItem}-{endItem} of {totalItems} items
      </div>
      <div className="flex items-center space-x-2">
        {currentPage > 1 ? (
          <Link href={getPageUrl(currentPage - 1)} passHref>
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
          <Link href={getPageUrl(currentPage + 1)} passHref>
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
  );
}

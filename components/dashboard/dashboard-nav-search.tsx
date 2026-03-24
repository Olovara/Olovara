"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useEffect, useId } from "react";

/** Filters sidebar links by matching `data-nav-label` and optional comma-separated `data-nav-search-keywords` (case-insensitive). */
export function useDashboardNavSearchFilter(
  navRef: React.RefObject<HTMLElement | null>,
  query: string
) {
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const q = query.trim().toLowerCase();
    nav.querySelectorAll<HTMLElement>("[data-nav-label]").forEach((el) => {
      const label = el.getAttribute("data-nav-label") || "";
      const extra = el.getAttribute("data-nav-search-keywords") || "";
      const combined = `${label} ${extra.replace(/,/g, " ")}`.toLowerCase();
      const match = !q || combined.includes(q);
      el.style.display = match ? "" : "none";
    });
    nav.querySelectorAll<HTMLElement>("[data-nav-separator]").forEach((el) => {
      el.style.display = q ? "none" : "";
    });
  }, [query, navRef]);
}

type DashboardNavSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** Merged into the search input (e.g. brand focus ring on mobile drawer) */
  inputClassName?: string;
};

export function DashboardNavSearchBar({
  value,
  onChange,
  className,
  inputClassName,
}: DashboardNavSearchBarProps) {
  const id = useId();
  return (
    <div className={cn("px-4 pb-2 pt-0", className)}>
      <label htmlFor={id} className="sr-only">
        Search menu
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search menu..."
          className={cn(
            "h-9 bg-background/80 pl-8 pr-3 text-sm",
            inputClassName
          )}
          autoComplete="off"
        />
      </div>
    </div>
  );
}

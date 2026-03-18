"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Redirect to search results page with query as a URL parameter
    if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center w-full" role="search" aria-label="Site search">
      <label htmlFor="header-search" className="sr-only">
        Search products
      </label>
      {/* Wrapper so we can show a custom clear (X) icon instead of browser default */}
      <div className="relative flex flex-grow">
        <input
          id="header-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full px-4 py-2 pr-9 text-sm border border-brand-dark-neutral-200 rounded-l-md bg-brand-light-neutral-50 text-brand-dark-neutral-900 placeholder:text-brand-dark-neutral-500 focus:outline-none focus:ring focus:ring-brand-primary-100"
          aria-label="Search products"
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-black hover:opacity-70 focus:outline-none focus:ring-0"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        )}
      </div>
      <button
        type="submit"
        className="px-4 py-2 text-sm text-brand-light-neutral-50 bg-brand-primary-700 rounded-r-md hover:bg-brand-primary-600 focus:outline-none focus:ring-2 focus:ring-brand-primary-100 focus:ring-offset-1"
      >
        Search
      </button>
    </form>
  );
}

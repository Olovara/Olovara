"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
      <input
        id="header-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products..."
        className="flex-grow px-4 py-2 text-sm border rounded-l-md focus:outline-none focus:ring focus:ring-muted"
        aria-label="Search products"
      />
      <button
        type="submit"
        className="px-4 py-2 text-sm text-white bg-black rounded-r-md hover:bg-gray-800"
      >
        Search
      </button>
    </form>
  );
}

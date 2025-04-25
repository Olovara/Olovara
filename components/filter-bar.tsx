"use client"

import { useRouter, useSearchParams } from "next/navigation";

export function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Sort By</h2>
        <select
          className="w-full p-2 border rounded-md"
          value={searchParams.get("sort") || ""}
          onChange={(e) => handleFilterChange("sort", e.target.value)}
        >
          <option value="">Relevance</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Price Range</h2>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            className="w-1/2 p-2 border rounded-md"
            value={searchParams.get("minPrice") || ""}
            onChange={(e) => handleFilterChange("minPrice", e.target.value)}
          />
          <input
            type="number"
            placeholder="Max"
            className="w-1/2 p-2 border rounded-md"
            value={searchParams.get("maxPrice") || ""}
            onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Condition</h2>
        <select
          className="w-full p-2 border rounded-md"
          value={searchParams.get("condition") || ""}
          onChange={(e) => handleFilterChange("condition", e.target.value)}
        >
          <option value="">All Conditions</option>
          <option value="new">New</option>
          <option value="used">Used</option>
        </select>
      </div>
    </div>
  );
} 
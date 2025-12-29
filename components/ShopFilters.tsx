"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { shopValues, validShopValueIds, ShopValueId } from "@/data/shop-values";

export function ShopFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get and sanitize selected values
  const rawSelectedValues = searchParams.get("values")?.split(",") || [];
  const selectedValues = rawSelectedValues.filter((value): value is ShopValueId =>
    validShopValueIds.includes(value as ShopValueId)
  );

  const sortBy = searchParams.get("sortBy") || "newest";

  const handleValueChange = (valueId: ShopValueId) => {
    const params = new URLSearchParams(searchParams.toString());
    const newValues = selectedValues.includes(valueId)
      ? selectedValues.filter((v) => v !== valueId)
      : [...selectedValues, valueId];

    if (newValues.length > 0) {
      params.set("values", newValues.join(","));
    } else {
      params.delete("values");
    }
    params.set("page", "1"); // Reset to first page when changing filters
    router.push(`?${params.toString()}`);
  };

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", value);
    params.set("page", "1"); // Reset to first page when changing sort
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Sort By</h2>
        <select
          className="w-full p-2 border rounded-md"
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="sales">Most Sales</option>
          <option value="products">Most Products</option>
          <option value="name-asc">Shop name A-Z</option>
          <option value="name-desc">Shop name Z-A</option>
        </select>
      </div>

      <Separator />

      <div>
        <h2 className="text-lg font-semibold mb-4">Shop Values</h2>
        <div className="space-y-2">
          {shopValues.map((value) => (
            <div key={value.id} className="flex items-center space-x-2">
              <Checkbox
                id={value.id}
                checked={selectedValues.includes(value.id)}
                onCheckedChange={() => handleValueChange(value.id)}
              />
              <Label
                htmlFor={value.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {value.name}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 
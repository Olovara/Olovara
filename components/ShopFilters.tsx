"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { shopValues, validShopValueIds, ShopValueId } from "@/data/shop-values";
import { getCountryByCode } from "@/data/countries";

export function ShopFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sellerCountries, setSellerCountries] = useState<string[]>([]);

  // Get and sanitize selected values
  const rawSelectedValues = searchParams.get("values")?.split(",") || [];
  const selectedValues = rawSelectedValues.filter((value): value is ShopValueId =>
    validShopValueIds.includes(value as ShopValueId)
  );
  const selectedCountries = searchParams.get("country")?.split(",").filter(Boolean) || [];

  const sortBy = searchParams.get("sortBy") || "newest";

  useEffect(() => {
    fetch("/api/shops/seller-countries")
      .then((res) => (res.ok ? res.json() : { countries: [] }))
      .then((data: { countries?: string[] }) => setSellerCountries(data?.countries ?? []))
      .catch(() => setSellerCountries([]));
  }, []);

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

  const handleCountryChange = (countryCode: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = searchParams.get("country")?.split(",").filter(Boolean) || [];
    const newCountries = current.includes(countryCode)
      ? current.filter((c) => c !== countryCode)
      : [...current, countryCode];
    if (newCountries.length > 0) {
      params.set("country", newCountries.join(","));
    } else {
      params.delete("country");
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Sort By</h2>
        <select
          className="w-full p-2 text-sm rounded-md border border-brand-dark-neutral-200 bg-brand-light-neutral-50 text-brand-dark-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-primary-100 focus:ring-offset-1"
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

      {sellerCountries.length > 0 && (
        <>
          <div>
            <h2 className="text-lg font-semibold mb-4">Seller location</h2>
            <p className="text-sm text-muted-foreground mb-2">
              Show shops from:
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sellerCountries.map((code) => {
                const country = getCountryByCode(code);
                const label = country?.name ?? code;
                return (
                  <div key={code} className="flex items-center space-x-2">
                    <Checkbox
                      id={`shop-country-${code}`}
                      checked={selectedCountries.includes(code)}
                      onCheckedChange={() => handleCountryChange(code)}
                    />
                    <Label
                      htmlFor={`shop-country-${code}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                    >
                      {label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
          <Separator />
        </>
      )}

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
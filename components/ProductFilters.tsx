"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Categories, PrimaryCategoryID, SecondaryCategoryID, getSecondaryCategories } from "@/data/categories";
import { shopValues } from "@/data/shop-values";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState, useRef } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCurrency } from "@/hooks/useCurrency";

// Types are now imported from categories.ts
// Price range from API returns min/max in each product's currency; we convert for display to user's selected currency.

export function ProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { formatPrice } = useCurrency();
  const [priceRange, setPriceRange] = useState<{
    min: number;
    max: number;
    minCurrency?: string;
    maxCurrency?: string;
  }>({ min: 0, max: 1000 });
  const [currentPriceRange, setCurrentPriceRange] = useState([0, 1000]);
  const [formattedMinPrice, setFormattedMinPrice] = useState<string>("");
  const [formattedMaxPrice, setFormattedMaxPrice] = useState<string>("");
  const [openCategories, setOpenCategories] = useState<Set<PrimaryCategoryID>>(new Set());
  const [openSecondaryCategories, setOpenSecondaryCategories] = useState<Set<SecondaryCategoryID>>(new Set());
  const selectedCategory = searchParams.get("category")?.split(",")[0];
  // Track the last pathname to detect navigation changes
  const lastPathname = useRef<string | null>(null);

  // Auto-check categories based on URL path when navigating to category pages
  // This syncs the filter checkboxes with the category page URL
  useEffect(() => {
    // Check if we're on a category page
    const categoryPageMatch = pathname.match(/^\/categories\/([^\/]+)(?:\/([^\/]+))?(?:\/([^\/]+))?$/);

    if (categoryPageMatch) {
      const [, primaryCategorySlug, secondaryCategorySlug] = categoryPageMatch;

      // Find the actual category objects by matching slugs (case-insensitive)
      const primaryCategory = Categories.find(
        (cat) => cat.id.toLowerCase() === primaryCategorySlug.toLowerCase()
      );

      let secondaryCategory: any = null;

      if (primaryCategory && secondaryCategorySlug) {
        secondaryCategory = primaryCategory.children.find(
          (cat) => cat.id.toLowerCase() === secondaryCategorySlug.toLowerCase()
        );
      }

      // Auto-expand relevant categories for better UX
      if (primaryCategory) {
        setOpenCategories((prev) => new Set([...Array.from(prev), primaryCategory.id]));

        if (secondaryCategory) {
          setOpenSecondaryCategories((prev) => new Set([...Array.from(prev), secondaryCategory.id as SecondaryCategoryID]));
        }
      }

      // Only auto-set categories when navigating to a new category page (pathname changed)
      // This allows manual filter changes without being overridden
      const pathnameChanged = lastPathname.current !== pathname;
      lastPathname.current = pathname;

      if (pathnameChanged) {
        // Set categories based on URL path when navigating to category page
        const params = new URLSearchParams(searchParams.toString());
        let categoriesToSet: string[] = [];

        if (secondaryCategory) {
          // On secondary category page - only check that specific secondary category
          categoriesToSet = [secondaryCategory.id];
        } else if (primaryCategory) {
          // On primary category page - check primary category and all its subcategories
          categoriesToSet = [primaryCategory.id];
          primaryCategory.children.forEach((secondary) => {
            categoriesToSet.push(secondary.id);
          });
        }

        if (categoriesToSet.length > 0) {
          params.set("category", categoriesToSet.join(","));
          // Preserve other filters (values, priceRange, etc.) when auto-setting categories
          router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
      }
    } else {
      // Not on a category page, reset the ref
      lastPathname.current = null;
    }
  }, [pathname, router, searchParams]);

  // Initialize price range from URL params
  useEffect(() => {
    const priceRangeParam = searchParams.get("priceRange");
    if (priceRangeParam) {
      const [min, max] = priceRangeParam.split(",").map(Number);
      setCurrentPriceRange([min, max]);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchPriceRange = async () => {
      try {
        // Build query params
        const params = new URLSearchParams();
        if (selectedCategory) {
          params.set("category", selectedCategory);
        }
        
        // Fetch price range from API route instead of server action
        const response = await fetch(`/api/products/price-range?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch price range");
        }
        
        const range = await response.json();
        setPriceRange(range);
        // Only update current range if it hasn't been set by URL params
        if (!searchParams.get("priceRange")) {
          setCurrentPriceRange([range.min, range.max]);
        }
      } catch (error) {
        console.error("Error fetching price range:", error);
        // Fallback to default range on error
        setPriceRange({ min: 0, max: 100000, minCurrency: "USD", maxCurrency: "USD" });
      }
    };
    fetchPriceRange();
  }, [selectedCategory, searchParams]);

  // Format price range labels: convert from each bound's currency to user's selected currency
  const minCurrency = priceRange.minCurrency ?? "USD";
  const maxCurrency = priceRange.maxCurrency ?? "USD";
  const currentMinCents = currentPriceRange[0];
  const currentMaxCents = currentPriceRange[1];
  useEffect(() => {
    let cancelled = false;
    const format = async () => {
      const [minStr, maxStr] = await Promise.all([
        formatPrice(currentMinCents, true, minCurrency),
        formatPrice(currentMaxCents, true, maxCurrency),
      ]);
      if (!cancelled) {
        setFormattedMinPrice(minStr);
        setFormattedMaxPrice(maxStr);
      }
    };
    format();
    return () => {
      cancelled = true;
    };
  }, [currentMinCents, currentMaxCents, minCurrency, maxCurrency, formatPrice]);

  const handleFilterChange = (key: string, value: string | string[]) => {
    const params = new URLSearchParams(searchParams.toString());

    if (Array.isArray(value)) {
      if (value.length > 0) {
        params.set(key, value.join(","));
      } else {
        params.delete(key);
      }
    } else {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    params.set("page", "1"); // Reset to first page when changing filters
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handlePriceChange = (values: number[]) => {
    setCurrentPriceRange(values);
  };

  const handlePriceCommit = (values: number[]) => {
    handleFilterChange("priceRange", values.join(","));
  };

  const handleValueChange = (valueId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentValues: string[] = searchParams.get("values")?.split(",") || [];
    const newValues: string[] = currentValues.includes(valueId)
      ? currentValues.filter((v) => v !== valueId)
      : [...currentValues, valueId];

    if (newValues.length > 0) {
      params.set("values", newValues.join(","));
    } else {
      params.delete("values");
    }
    params.set("page", "1"); // Reset to first page when changing filters
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", value);
    params.set("page", "1"); // Reset to first page when changing sort
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleFollowedSellersChange = (checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (checked) {
      params.set("followedSellers", "true");
    } else {
      params.delete("followedSellers");
    }
    params.set("page", "1"); // Reset to first page when changing filters
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleCategoryToggle = (categoryId: PrimaryCategoryID) => {
    const newOpenCategories = new Set(openCategories);
    if (newOpenCategories.has(categoryId)) {
      newOpenCategories.delete(categoryId);
    } else {
      newOpenCategories.add(categoryId);
    }
    setOpenCategories(newOpenCategories);
  };

  const handleSecondaryCategoryToggle = (categoryId: SecondaryCategoryID) => {
    const newOpenSecondaryCategories = new Set(openSecondaryCategories);
    if (newOpenSecondaryCategories.has(categoryId)) {
      newOpenSecondaryCategories.delete(categoryId);
    } else {
      newOpenSecondaryCategories.add(categoryId);
    }
    setOpenSecondaryCategories(newOpenSecondaryCategories);
  };

  const handleCategoryChange = (categoryId: string, level: 'primary' | 'secondary') => {
    const params = new URLSearchParams(searchParams.toString());

    if (level === 'primary') {
      // For primary categories, we need to handle both the primary and its subcategories
      const subcategories = getSecondaryCategories(categoryId as PrimaryCategoryID);
      const newCategories = new Set(selectedCategories);

      if (newCategories.has(categoryId)) {
        // Remove primary category and its subcategories
        newCategories.delete(categoryId);
        subcategories.forEach(sub => newCategories.delete(sub));
      } else {
        // Add primary category and its subcategories
        newCategories.add(categoryId);
        subcategories.forEach(sub => newCategories.add(sub));
      }

      if (newCategories.size === 0) {
        params.delete("category");
      } else {
        params.set("category", Array.from(newCategories).join(","));
      }
    } else if (level === 'secondary') {
      // For secondary categories, just toggle the specific category
      const newCategories = new Set(selectedCategories);
      if (newCategories.has(categoryId)) {
        newCategories.delete(categoryId);
      } else {
        newCategories.add(categoryId);
      }

      if (newCategories.size === 0) {
        params.delete("category");
      } else {
        params.set("category", Array.from(newCategories).join(","));
      }
    }

    params.set("page", "1"); // Reset to first page when changing categories

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const selectedCategories = searchParams.get("category")?.split(",") || [];
  const selectedValues = searchParams.get("values")?.split(",") || [];
  const sortBy = searchParams.get("sortBy") || "relevant";
  const followedSellers = searchParams.get("followedSellers") === "true";

  return (
    <div className="space-y-6">
      {/* Sort By */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Sort By</h3>
        <Select
          value={sortBy}
          onValueChange={(value) => handleSortChange(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select sort option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevant">Most Relevant</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Categories */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Categories</h3>
        <div className="space-y-0 divide-y divide-border">
          {Categories.map((primaryCategory) => (
            <Collapsible
              key={primaryCategory.id}
              open={openCategories.has(primaryCategory.id)}
              onOpenChange={() => handleCategoryToggle(primaryCategory.id)}
              className="py-3"
            >
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={primaryCategory.id}
                  checked={selectedCategories.includes(primaryCategory.id)}
                  onCheckedChange={() => handleCategoryChange(primaryCategory.id, 'primary')}
                />
                <label
                  htmlFor={primaryCategory.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                >
                  {primaryCategory.name}
                </label>
                <CollapsibleTrigger className="ml-2">
                  {openCategories.has(primaryCategory.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="pl-6">
                <div className="space-y-0 divide-y divide-border mt-4">
                  {primaryCategory.children.map((subcategory) => (
                    <div key={subcategory.id} className="py-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={subcategory.id}
                          checked={selectedCategories.includes(subcategory.id)}
                          onCheckedChange={() => handleCategoryChange(subcategory.id, 'secondary')}
                        />
                        <label
                          htmlFor={subcategory.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                        >
                          {subcategory.name}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Price Range</h3>
        <div className="px-2">
          <Slider
            min={priceRange.min / 100}
            max={priceRange.max / 100}
            step={0.01}
            value={currentPriceRange.map(price => price / 100)}
            onValueChange={(values) => handlePriceChange(values.map(price => Math.round(price * 100)))}
            onValueCommit={(values) => handlePriceCommit(values.map(price => Math.round(price * 100)))}
            minStepsBetweenThumbs={1}
            className="my-4"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formattedMinPrice || `$${(currentPriceRange[0] / 100).toFixed(2)}`}</span>
            <span>{formattedMaxPrice || `$${(currentPriceRange[1] / 100).toFixed(2)}`}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Followed Sellers Filter - Only show if user is logged in */}
      {session?.user && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Followed Sellers</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="followedSellers"
                checked={followedSellers}
                onCheckedChange={handleFollowedSellersChange}
              />
              <Label htmlFor="followedSellers">Show only products from followed sellers</Label>
            </div>
          </div>
        </div>
      )}

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
              <Label htmlFor={value.id}>{value.name}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

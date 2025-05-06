"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter, useSearchParams } from "next/navigation";

const SUGGESTION_TYPES = [
  { value: "Feature", label: "Feature Request" },
  { value: "Bug", label: "Bug Report" },
  { value: "Improvement", label: "Feature Improvement" },
  { value: "Addition", label: "Feature Addition" },
  { value: "Other", label: "Other" },
];

const SORT_OPTIONS = [
  { value: "upvotes-desc", label: "Most Upvoted" },
  { value: "upvotes-asc", label: "Least Upvoted" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
];

export function SuggestionFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    searchParams.get("types")?.split(",") || []
  );
  const [sortBy, setSortBy] = useState(
    searchParams.get("sort") || "upvotes-desc"
  );

  const handleTypeChange = (type: string) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    
    setSelectedTypes(newTypes);
    updateUrl({ types: newTypes });
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    updateUrl({ sort: value });
  };

  const updateUrl = (params: { types?: string[]; sort?: string }) => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    if (params.types !== undefined) {
      if (params.types.length > 0) {
        newParams.set("types", params.types.join(","));
      } else {
        newParams.delete("types");
      }
    }
    
    if (params.sort) {
      newParams.set("sort", params.sort);
    }
    
    router.push(`?${newParams.toString()}`);
  };

  return (
    <Card className="p-4 space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Filter by Type</h3>
        <div className="space-y-3">
          {SUGGESTION_TYPES.map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <Checkbox
                id={type.value}
                checked={selectedTypes.includes(type.value)}
                onCheckedChange={() => handleTypeChange(type.value)}
              />
              <Label
                htmlFor={type.value}
                className="text-sm font-normal cursor-pointer"
              >
                {type.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Sort By</h3>
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
} 
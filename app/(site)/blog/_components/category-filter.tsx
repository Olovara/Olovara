"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface CategoryFilterProps {
  categories: {
    id: string;
    slug: string;
    title: string;
  }[];
  selectedCategory?: string;
}

export const CategoryFilter = ({
  categories,
  selectedCategory,
}: CategoryFilterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCategoryClick = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (slug === selectedCategory) {
      params.delete("category");
    } else {
      params.set("category", slug);
    }

    router.push(`/blog?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <Button
        variant={!selectedCategory ? "default" : "outline"}
        onClick={() => handleCategoryClick("")}
        className="rounded-full"
      >
        All
      </Button>
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.slug ? "default" : "outline"}
          onClick={() => handleCategoryClick(category.slug)}
          className="rounded-full"
        >
          {category.title}
        </Button>
      ))}
    </div>
  );
}; 
"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Menu as MenuIcon, Search as SearchIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CategoriesMap } from "@/data/categories";

interface MobileMenuProps {
  userInfo?: {
    role: "SUPER_ADMIN" | "ADMIN" | "SELLER" | "MEMBER";
    id: string;
    username: string | null;
    email: string | null;
    image: string | null;
  } | null;
}

export function MobileMenu({ userInfo }: MobileMenuProps) {
  const location = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Redirect to search results page
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <MenuIcon className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <div className="mt-5 px-4 space-y-4">
          {/* Search Bar */}
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" onClick={handleSearch}>
              <SearchIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* Become a Seller Button - Only show for non-sellers */}
          {userInfo?.role !== "SELLER" && (
            <Link
              href="/seller-application"
              className={cn(
                location === "/seller-application"
                  ? "bg-muted"
                  : "hover:bg-muted hover:bg-opacity-75",
                "block px-2 py-2 font-medium rounded-md text-center"
              )}
            >
              Become a Seller
            </Link>
          )}

          {/* Categories */}
          <div className="space-y-2 pt-4 border-t border-gray-200">
            <h3 className="font-semibold text-sm text-gray-900">Categories</h3>
            {CategoriesMap.PRIMARY.map((category) => {
              const secondaryCategories = CategoriesMap.SECONDARY.filter(
                sec => sec.primaryCategoryId === category.id
              );
              
              return (
                <div key={category.id} className="space-y-1">
                  <Link
                    href={`/categories/${category.id.toLowerCase()}`}
                    className={cn(
                      location === `/categories/${category.id.toLowerCase()}`
                        ? "text-primary font-medium"
                        : "text-gray-700 hover:text-primary",
                      "block text-sm"
                    )}
                  >
                    {category.name}
                  </Link>
                  
                  {/* Secondary Categories */}
                  {secondaryCategories.length > 0 && (
                    <div className="ml-4 space-y-1">
                      {secondaryCategories.slice(0, 3).map((secondary) => (
                        <Link
                          key={secondary.id}
                          href={`/categories/${category.id.toLowerCase()}/${secondary.id.toLowerCase()}`}
                          className="block text-xs text-gray-600 hover:text-primary"
                        >
                          {secondary.name}
                        </Link>
                      ))}
                      {secondaryCategories.length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{secondaryCategories.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

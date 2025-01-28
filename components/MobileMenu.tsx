"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu as MenuIcon, Search as SearchIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useState } from "react";

// Example categories (replace with dynamic data if needed)
const categories = [
  { id: 1, name: "Accessories", href: "/category/accessories" },
  { id: 2, name: "Templates", href: "/category/templates" },
  { id: 3, name: "UI Kits", href: "/category/uikits" },
  { id: 4, name: "Icons", href: "/category/icons" },
];

export function MobileMenu() {
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

          {/* Categories Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full">
                Categories
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {categories.map((category) => (
                <DropdownMenuItem key={category.id} asChild>
                  <Link
                    href={category.href}
                    className={cn(
                      location === category.href
                        ? "font-semibold text-primary"
                        : "hover:text-primary"
                    )}
                  >
                    {category.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Additional Links */}
          <div className="space-y-2">
            <Link
              href="/seller-application"
              className={cn(
                location === "/seller-application"
                  ? "bg-muted"
                  : "hover:bg-muted hover:bg-opacity-75",
                "block px-2 py-2 font-medium rounded-md"
              )}
            >
              Become a Seller
            </Link>
            {/* Add other important links here */}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

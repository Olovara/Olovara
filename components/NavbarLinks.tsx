"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Menu as MenuIcon } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { CategoriesMap } from "@/data/categories";
import { ProtectedLink } from "./shared/ProtectedLink";

export function NavbarLinks() {
  const location = usePathname();
  const primaryCategories = CategoriesMap.PRIMARY;

  return (
    <div className="hidden md:flex justify-center items-center col-span-6 gap-x-4">
      {/* Categories Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <MenuIcon size={18} />
            Categories
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          {primaryCategories.map((category) => (
            <DropdownMenuItem key={category.id} asChild>
              <Link
                href={`/categories/${category.id.toLowerCase()}`}
                className={cn(
                  location === `/categories/${category.id.toLowerCase()}`
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

      <SearchBar />

      {/* Become a Seller Button */}
      <ProtectedLink
        href="/seller-application"
        className={cn(
          location === "/seller-application"
            ? "bg-muted"
            : "hover:bg-muted hover:bg-opacity-75",
          "px-4 py-2 font-medium rounded-md whitespace-nowrap"
        )}
      >
        Become a Seller
      </ProtectedLink>
    </div>
  );
}

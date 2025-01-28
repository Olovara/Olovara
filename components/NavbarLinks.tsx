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

// Example categories array (replace with dynamic data if needed)
const categories = [
  { id: 1, name: "Accessories", href: "/category/accessories" },
  { id: 2, name: "Templates", href: "/category/templates" },
  { id: 3, name: "UI Kits", href: "/category/uikits" },
  { id: 4, name: "Icons", href: "/category/icons" },
];

export function NavbarLinks() {
  const location = usePathname();

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

      <SearchBar/>

      {/* Other Navbar Links */}
      <div className="flex gap-x-2">
        <Link
          href="/seller-application"
          className={cn(
            location === "/seller-application"
              ? "bg-muted"
              : "hover:bg-muted hover:bg-opacity-75",
            "group flex items-center px-2 py-2 font-medium rounded-md"
          )}
        >
          Become a Seller
        </Link>
      </div>
    </div>
  );
}

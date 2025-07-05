"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Menu as MenuIcon, Search as SearchIcon, ChevronRight, ArrowLeft } from "lucide-react";
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

type ViewState = 'main' | 'secondary' | 'tertiary';

export function MobileMenu({ userInfo }: MobileMenuProps) {
  const location = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewState, setViewState] = useState<ViewState>('main');
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<string | null>(null);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handlePrimaryClick = (categoryId: string) => {
    setSelectedPrimary(categoryId);
    setViewState('secondary');
  };

  const handleSecondaryClick = (secondaryId: string) => {
    setSelectedSecondary(secondaryId);
    setViewState('tertiary');
  };

  const handleBack = () => {
    if (viewState === 'tertiary') {
      setViewState('secondary');
      setSelectedSecondary(null);
    } else if (viewState === 'secondary') {
      setViewState('main');
      setSelectedPrimary(null);
    }
  };

  const getCurrentPrimary = () => CategoriesMap.PRIMARY.find(c => c.id === selectedPrimary);
  const getCurrentSecondary = () => CategoriesMap.SECONDARY.find(s => s.id === selectedSecondary);

  const renderMainView = () => (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg text-gray-900">Categories</h3>
      <div className="space-y-2">
        {CategoriesMap.PRIMARY.map((category) => (
          <button
            key={category.id}
            onClick={() => handlePrimaryClick(category.id)}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors rounded-md"
          >
            <span className="font-medium text-gray-900">{category.name}</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        ))}
      </div>
    </div>
  );

  const renderSecondaryView = () => {
    const primary = getCurrentPrimary();
    const secondaryCategories = CategoriesMap.SECONDARY.filter(
      sec => sec.primaryCategoryId === selectedPrimary
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <button onClick={handleBack} className="flex items-center gap-1 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <ChevronRight className="w-3 h-3" />
          <span className="font-medium text-gray-900">{primary?.name}</span>
        </div>
        
        <div className="space-y-2">
          {secondaryCategories.map((secondary) => {
            const tertiaryCategories = CategoriesMap.TERTIARY.filter(
              ter => ter.secondaryCategoryId === secondary.id
            );
            
            return (
              <button
                key={secondary.id}
                onClick={() => handleSecondaryClick(secondary.id)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors rounded-md"
              >
                <span className="font-medium text-gray-900">{secondary.name}</span>
                {tertiaryCategories.length > 0 && (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Shop All Primary Category */}
        <div className="pt-4 border-t border-gray-200">
          <Link
            href={`/categories/${primary?.id.toLowerCase()}`}
            className="block p-3 text-left hover:bg-gray-50 transition-colors rounded-md"
          >
            <span className="font-medium text-primary">Shop all {primary?.name}</span>
          </Link>
        </div>
      </div>
    );
  };

  const renderTertiaryView = () => {
    const primary = getCurrentPrimary();
    const secondary = getCurrentSecondary();
    const tertiaryCategories = CategoriesMap.TERTIARY.filter(
      ter => ter.secondaryCategoryId === selectedSecondary
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <button onClick={handleBack} className="flex items-center gap-1 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <ChevronRight className="w-3 h-3" />
          <span className="font-medium text-gray-900">{primary?.name}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="font-medium text-gray-900">{secondary?.name}</span>
        </div>
        
        <div className="space-y-2">
          {tertiaryCategories.map((tertiary) => (
            <Link
              key={tertiary.id}
              href={`/categories/${primary?.id.toLowerCase()}/${secondary?.id.toLowerCase()}/${tertiary.id.toLowerCase()}`}
              className="block p-3 text-left hover:bg-gray-50 transition-colors rounded-md"
            >
              <span className="font-medium text-gray-900">{tertiary.name}</span>
            </Link>
          ))}
        </div>

        {/* Shop All Secondary Category */}
        <div className="pt-4 border-t border-gray-200">
          <Link
            href={`/categories/${primary?.id.toLowerCase()}/${secondary?.id.toLowerCase()}`}
            className="block p-3 text-left hover:bg-gray-50 transition-colors rounded-md"
          >
            <span className="font-medium text-primary">Shop all {secondary?.name}</span>
          </Link>
        </div>
      </div>
    );
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Open mobile menu">
          <MenuIcon className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="top" className="w-full h-full p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-purple-100">
            <SheetTitle className="text-xl font-semibold text-left">
              Yarnnu
            </SheetTitle>
            <SheetDescription className="text-left mt-1">
              Find your favorite products
            </SheetDescription>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Search Bar */}
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex items-center w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-grow px-4 py-2 text-sm border rounded-l-md focus:outline-none focus:ring focus:ring-muted"
              />
              <button
                type="submit"
                className="px-4 py-2 text-sm text-white bg-black rounded-r-md hover:bg-gray-800"
              >
                Search
              </button>
            </form>

            {/* Shop Now Button */}
            <Link
              href="/products"
              className="block w-full px-4 py-3 text-center font-medium text-white bg-primary hover:bg-primary/90 transition-colors rounded-md"
            >
              Shop Now
            </Link>

            {/* Become a Seller Button - Only show for non-sellers */}
            {userInfo?.role !== "SELLER" && (
              <div className="space-y-2">
                <Link
                  href="/seller-application"
                  className={cn(
                    location === "/seller-application"
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-100 hover:bg-gray-200",
                    "block px-4 py-3 font-medium rounded-lg text-center transition-colors"
                  )}
                >
                  Become a Seller
                </Link>
              </div>
            )}

            {/* Progressive Category Navigation */}
            {viewState === 'main' && renderMainView()}
            {viewState === 'secondary' && renderSecondaryView()}
            {viewState === 'tertiary' && renderTertiaryView()}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-100">
            <p className="text-xs text-gray-500 text-center">
              &copy; {new Date().getFullYear()} Yarnnu. All Rights Reserved
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

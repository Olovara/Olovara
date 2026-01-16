"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Categories } from "@/data/categories";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FONTS } from "@/lib/fonts";

export function NavbarLinks() {
  const location = usePathname();
  const primaryCategories = Categories;
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [lastOpenedCategory, setLastOpenedCategory] = useState<string | null>(
    null
  );

  const handleCategoryHover = (categoryId: string) => {
    setHoveredCategory(categoryId);
    setLastOpenedCategory(categoryId);
  };

  const handleCategoryLeave = () => {
    setHoveredCategory(null);
  };

  const handleDropdownEnter = () => {
    // Keep the last opened category active when hovering dropdown
    if (lastOpenedCategory) {
      setHoveredCategory(lastOpenedCategory);
    }
  };

  const handleDropdownLeave = () => {
    setHoveredCategory(null);
    setLastOpenedCategory(null);
  };

  // Use lastOpenedCategory for dropdown content, but hoveredCategory for visual feedback
  const activeCategory = hoveredCategory || lastOpenedCategory;

  return (
    <>
      {/* Categories Navigation */}
      <div className="flex justify-center items-center">
        <div
          className="flex items-center gap-x-6 px-6"
          onMouseLeave={() => {
            setHoveredCategory(null);
            setLastOpenedCategory(null);
          }}
        >
          {primaryCategories.map((category) => {
            const secondaryCategories = category.children;

            return (
              <div
                key={category.id}
                className="relative"
                onMouseEnter={() => handleCategoryHover(category.id)}
              >
                <Link
                  href={`/categories/${category.id.toLowerCase()}`}
                  className={cn(
                    "text-xs font-medium transition-colors duration-200 py-2 relative",
                    location === `/categories/${category.id.toLowerCase()}`
                      ? "text-primary"
                      : "text-foreground hover:text-primary",
                    hoveredCategory === category.id && "text-primary"
                  )}
                >
                  {category.name.toUpperCase()}
                  {hoveredCategory === category.id && (
                    <motion.div
                      layoutId="activeCategory"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full-Width Dropdown Overlay - Positioned relative to viewport */}
      <AnimatePresence>
        {activeCategory && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={cn(
              "fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-xl z-50",
              FONTS.NAVBAR
            )}
            style={{
              top: "120px", // Approximate navbar height
              width: "100vw",
            }}
            onMouseEnter={handleDropdownEnter}
            onMouseLeave={handleDropdownLeave}
          >
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
              {(() => {
                const category = Categories.find(
                  (c) => c.id === activeCategory
                );
                const secondaryCategories = category?.children || [];

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {secondaryCategories.map((secondary) => (
                      <div key={secondary.id} className="space-y-3">
                        <Link
                          href={`/categories/${category?.id.toLowerCase()}/${secondary.id.toLowerCase()}`}
                          className="block font-semibold text-lg text-gray-900 hover:text-primary transition-colors"
                        >
                          {secondary.name.toUpperCase()}
                        </Link>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* View All Link */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <Link
                  href={`/categories/${activeCategory.toLowerCase()}`}
                  className="inline-flex items-center text-primary hover:underline font-medium"
                >
                  View all{" "}
                  {Categories.find(
                    (c) => c.id === activeCategory
                  )?.name.toUpperCase()}
                  <svg
                    className="ml-2 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

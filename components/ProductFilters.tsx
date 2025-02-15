"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Spinner from "./spinner";
import { Slider } from "./ui/slider";
import { Select, SelectItem, SelectContent, SelectTrigger } from "./ui/select";
import { useFilters } from "@/hooks/use-filters";
import { X } from "lucide-react"; // Close icon

export default function Filters() {
  const [isOpen, setIsOpen] = useState(false); // State for sidebar visibility

  const {
    orderByList,
    categoryList,
    selectOrder,
    selectPrice,
    filters,
    totalCount,
    isPending,
  } = useFilters();

  const { category, priceRange: selectedPriceRange, orderBy } = filters;

  return (
    <>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-20 bg-black text-white px-4 py-2 rounded-lg shadow-md"
      >
        Filters
      </button>

      {/* Overlay when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Animate with Framer Motion */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 z-20 h-full w-72 bg-white p-4 shadow-lg"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black"
            >
              <X size={24} />
            </button>

            {/* Sidebar Content */}
            <div className="space-y-6 mt-10">
              {/* Results Count */}
              <div className="flex gap-2 items-center">
                <div className="text-default font-semibold text-xl">
                  Results: {isPending ? <Spinner /> : totalCount}
                </div>
              </div>

              {/* Price Range Filter */}
              <div>
                <Slider
                  label="Price Range"
                  size="sm"
                  minValue={5}
                  maxValue={1000}
                  value={selectedPriceRange}
                  aria-label="Price range slider"
                  color="foreground"
                  onChangeEnd={(value) => selectPrice(value as number[])}
                />
              </div>

              {/* Order By Filter */}
              <div>
                <Select
                  label="Order by"
                  variant="bordered"
                  color="default"
                  aria-label="Order by selector"
                  selectedKeys={new Set([orderBy])}
                  onSelectionChange={selectOrder}
                >
                  <SelectTrigger>
                    <div>Select Order</div>
                  </SelectTrigger>
                  <SelectContent>
                    {orderByList.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

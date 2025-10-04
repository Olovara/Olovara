"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormContext } from "react-hook-form";
import { ProductSchema } from "@/schemas/ProductSchema";
import { SUPPORTED_CURRENCIES } from "@/data/units";

type DropdownOption = {
  label: string;
  values: { name: string; price?: number; stock: number }[];
};

type ProductOptionsSectionProps = {
  dropdownOptions: DropdownOption[];
  setDropdownOptions: React.Dispatch<React.SetStateAction<DropdownOption[]>>;
};

export function ProductOptionsSection({
  dropdownOptions,
  setDropdownOptions,
}: ProductOptionsSectionProps) {
  const { watch } = useFormContext();
  const selectedCurrency = watch("currency") || "USD";
  
  // Get currency info for the selected currency
  const getCurrencyInfo = (currencyCode: string) => {
    return SUPPORTED_CURRENCIES.find(c => c.code === currencyCode) || SUPPORTED_CURRENCIES[0];
  };

  const currencyInfo = getCurrencyInfo(selectedCurrency);
  // Add a new dropdown with default values
  const addDropdownOption = () => {
    setDropdownOptions((prev) => [
      ...prev,
      { label: "", values: [{ name: "", stock: 0 }] },
    ]);
  };

  // Add a new value to a dropdown
  const addDropdownValue = (index: number) => {
    setDropdownOptions((prev) =>
      prev.map((option, i) =>
        i === index
          ? {
              ...option,
              values: [...option.values, { name: "", price: undefined, stock: 0 }],
            }
          : option
      )
    );
  };

  // Remove a dropdown option
  const removeDropdownOption = (index: number) => {
    setDropdownOptions((prev) => prev.filter((_, i) => i !== index));
  };

  // Update dropdown label or values
  const updateDropdownOption = (
    index: number,
    field: "label" | "values",
    value: string | { name: string; stock: number }[]
  ) => {
    setDropdownOptions((prev) =>
      prev.map((option, i) =>
        i === index
          ? {
              ...option,
              [field]:
                field === "values"
                  ? (value as { name: string; stock: number }[])
                  : (value as string),
            }
          : option
      )
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">Product Options / Variations</Label>
        <p className="text-sm text-gray-600 mt-1">
          Create different variations of your product (e.g., sizes, colors) with individual pricing and stock levels.
        </p>
      </div>
      
      <Button variant="outline" type="button" onClick={addDropdownOption}>
        Add Option Group
      </Button>

      {dropdownOptions.map((option, index) => (
        <div key={index} className="space-y-4 mt-4 p-4 border rounded-lg bg-white">
          {/* Dropdown Label */}
          <div className="flex items-center gap-x-4">
            <div className="flex-1">
              <Label className="text-sm font-medium text-gray-700">Option Group Name</Label>
              <Input
                placeholder="e.g., Size, Color, Material"
                value={option.label}
                onChange={(e) =>
                  updateDropdownOption(index, "label", e.target.value)
                }
                className="mt-1"
              />
            </div>
            <Button
              variant="destructive"
              type="button"
              onClick={() => removeDropdownOption(index)}
              className="mt-6"
            >
              Remove Group
            </Button>
          </div>

          {/* Dropdown Values with Price and Stock */}
          {option.values.map((value, valueIndex) => (
            <div key={valueIndex} className="space-y-2 mt-2 p-3 bg-gray-50 rounded-md">
              <div className="flex items-center gap-x-4">
                {/* Option Name */}
                <div className="flex-1">
                  <Label className="text-xs text-gray-600">Option Value</Label>
                  <Input
                    placeholder="e.g., Small, Medium, Large"
                    value={value.name}
                    onChange={(e) => {
                      const newValues = [...option.values];
                      newValues[valueIndex].name = e.target.value;
                      updateDropdownOption(index, "values", newValues);
                    }}
                  />
                </div>
                
                {/* Price */}
                <div className="flex-1">
                  <Label className="text-xs text-gray-600">Price (Optional)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      {currencyInfo.symbol}
                    </span>
                    <Input
                      type="number"
                      step={1 / Math.pow(10, currencyInfo.decimals)}
                      min={0}
                      placeholder="0.00"
                      value={value.price || ""}
                      onChange={(e) => {
                        const newValues = [...option.values];
                        newValues[valueIndex].price = e.target.value ? parseFloat(e.target.value) : undefined;
                        updateDropdownOption(index, "values", newValues);
                      }}
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to use base product price
                  </p>
                </div>
                
                {/* Stock */}
                <div className="flex-1">
                  <Label className="text-xs text-gray-600">Stock</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={value.stock}
                    onChange={(e) => {
                      const newValues = [...option.values];
                      newValues[valueIndex].stock = parseInt(e.target.value) || 0;
                      updateDropdownOption(index, "values", newValues);
                    }}
                  />
                </div>
                
                {/* Remove Value Button */}
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => {
                    const newValues = option.values.filter((_, i) => i !== valueIndex);
                    updateDropdownOption(index, "values", newValues);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}

          {/* Add Option Value Button */}
          <Button
            variant="outline"
            type="button"
            onClick={() => addDropdownValue(index)}
            className="mt-2"
          >
            Add Value
          </Button>
        </div>
      ))}
    </div>
  );
}

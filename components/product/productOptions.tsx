"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormContext } from "react-hook-form";
import { ProductSchema } from "@/schemas/ProductSchema";
import { SUPPORTED_CURRENCIES } from "@/data/units";
import { Trash2 } from "lucide-react";

type DropdownOption = {
  label: string;
  values: { name: string; description?: string; price?: number; stock: number }[]; // Optional description for each value explaining what makes it special
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
    return (
      SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode) ||
      SUPPORTED_CURRENCIES[0]
    );
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
              values: [
                ...option.values,
                { name: "", description: "", price: undefined, stock: 0 },
              ],
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
    value: string | { name: string; description?: string; stock: number }[]
  ) => {
    setDropdownOptions((prev) =>
      prev.map((option, i) =>
        i === index
          ? {
              ...option,
              [field]:
                field === "values"
                  ? (value as { name: string; description?: string; stock: number }[])
                  : (value as string),
            }
          : option
      )
    );
  };

  return (
    <div className="space-y-4 pb-2">
      <div>
        <span className="text-sm font-medium" role="heading" aria-level={2}>
          Product Options / Variations
        </span>
        <p className="text-xs text-muted-foreground mt-1">
          Create different variations of your product (e.g., sizes, colors) with
          individual pricing and stock levels.
        </p>
      </div>

      <Button variant="outline" type="button" onClick={addDropdownOption}>
        Add Option Group
      </Button>

      {dropdownOptions.map((option, index) => (
        <div
          key={index}
          className="space-y-4 mt-4 p-4 border rounded-lg bg-white"
        >
          {/* Dropdown Label - htmlFor + id so label is associated with control */}
          <div className="flex items-center gap-x-4">
            <div className="flex-1">
              <Label htmlFor={`option-group-name-${index}`} className="text-sm font-medium text-gray-700">
                Option Group Name
              </Label>
              <Input
                id={`option-group-name-${index}`}
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
            <div
              key={valueIndex}
              className="space-y-3 mt-2 p-3 bg-gray-50 rounded-md relative"
            >
              {/* Remove Value Button - positioned at top right */}
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  const newValues = option.values.filter(
                    (_, i) => i !== valueIndex
                  );
                  updateDropdownOption(index, "values", newValues);
                }}
                className="absolute top-2 right-2 h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              {/* Stacked fields vertically */}
              <div className="space-y-3 pr-16">
                {/* Option Name */}
                <div>
                  <Label htmlFor={`option-value-${index}-${valueIndex}`} className="text-xs text-gray-600">Option Value</Label>
                  <Input
                    id={`option-value-${index}-${valueIndex}`}
                    placeholder="e.g., Small, Medium, Large"
                    value={value.name}
                    onChange={(e) => {
                      const newValues = [...option.values];
                      newValues[valueIndex].name = e.target.value;
                      updateDropdownOption(index, "values", newValues);
                    }}
                    className="mt-1"
                  />
                </div>

                {/* Price */}
                <div>
                  <Label htmlFor={`option-price-${index}-${valueIndex}`} className="text-xs text-gray-600">
                    Additional Price (Optional)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      {currencyInfo.symbol}
                    </span>
                    <Input
                      id={`option-price-${index}-${valueIndex}`}
                      type="number"
                      step={1 / Math.pow(10, currencyInfo.decimals)}
                      min={0}
                      placeholder="0.00"
                      value={value.price || ""}
                      onChange={(e) => {
                        const newValues = [...option.values];
                        // Validate price input - prevent NaN and negative values
                        const inputValue = e.target.value.trim();
                        if (inputValue === "") {
                          newValues[valueIndex].price = undefined;
                        } else {
                          const parsed = parseFloat(inputValue);
                          // Only set price if valid number and non-negative
                          newValues[valueIndex].price =
                            !isNaN(parsed) && parsed >= 0
                              ? parsed
                              : value.price;
                        }
                        updateDropdownOption(index, "values", newValues);
                      }}
                      className="pl-8 mt-1"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Additional cost above base product price. Leave empty to use
                    base price only.
                  </p>
                </div>

                {/* Stock */}
                <div>
                  <Label htmlFor={`option-stock-${index}-${valueIndex}`} className="text-xs text-gray-600">Stock</Label>
                  <Input
                    id={`option-stock-${index}-${valueIndex}`}
                    type="number"
                    min="0"
                    placeholder="0"
                    value={value.stock}
                    onChange={(e) => {
                      const newValues = [...option.values];
                      // Validate stock input - prevent NaN and negative values
                      const inputValue = e.target.value.trim();
                      if (inputValue === "") {
                        newValues[valueIndex].stock = 0;
                      } else {
                        const parsed = parseInt(inputValue, 10);
                        // Only set stock if valid integer and non-negative
                        newValues[valueIndex].stock =
                          !isNaN(parsed) && parsed >= 0 ? parsed : value.stock;
                      }
                      updateDropdownOption(index, "values", newValues);
                    }}
                    className="mt-1"
                  />
                </div>

                {/* Value Description */}
                <div>
                  <Label htmlFor={`option-desc-${index}-${valueIndex}`} className="text-xs text-gray-600">
                    Description (Optional)
                  </Label>
                  <p className="text-xs text-gray-500 mt-1 mb-1">
                    Explain what makes this value special
                  </p>
                  <Textarea
                    id={`option-desc-${index}-${valueIndex}`}
                    placeholder="e.g., This size includes extra fabric for a looser fit..."
                    value={value.description || ""}
                    onChange={(e) => {
                      const newValues = [...option.values];
                      newValues[valueIndex].description = e.target.value;
                      updateDropdownOption(index, "values", newValues);
                    }}
                    className="mt-1 min-h-[60px]"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {(value.description || "").length}/500 characters
                  </p>
                </div>
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

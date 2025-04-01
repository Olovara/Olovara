"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DropdownOption = {
  label: string;
  values: { name: string; stock: number }[];
};

type ProductOptionsSectionProps = {
  dropdownOptions: DropdownOption[];
  setDropdownOptions: React.Dispatch<React.SetStateAction<DropdownOption[]>>;
};

export function ProductOptionsSection({
  dropdownOptions,
  setDropdownOptions,
}: ProductOptionsSectionProps) {
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
              values: [...option.values, { name: "", stock: 0 }],
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
    <div>
      <Label>Options / Variations</Label>
      <Button variant="outline" type="button" onClick={addDropdownOption}>
        Add Dropdown
      </Button>

      {dropdownOptions.map((option, index) => (
        <div key={index} className="space-y-2 mt-4 p-4 border rounded-lg">
          {/* Dropdown Label */}
          <div className="flex items-center gap-x-4">
            <Input
              placeholder="Dropdown Label (e.g., Size)"
              value={option.label}
              onChange={(e) =>
                updateDropdownOption(index, "label", e.target.value)
              }
            />
            <Button
              variant="destructive"
              type="button"
              onClick={() => removeDropdownOption(index)}
            >
              Remove
            </Button>
          </div>

          {/* Dropdown Values with Stock */}
          {option.values.map((value, valueIndex) => (
            <div key={valueIndex} className="flex items-center gap-x-4 mt-2">
              {/* Option Name */}
              <Input
                placeholder="Option Value (e.g., Small)"
                value={value.name}
                onChange={(e) => {
                  const newValues = [...option.values];
                  newValues[valueIndex].name = e.target.value;
                  updateDropdownOption(index, "values", newValues);
                }}
              />
              {/* Stock Amount */}
              <Input
                type="number"
                placeholder="Stock"
                value={value.stock}
                onChange={(e) => {
                  const newValues = [...option.values];
                  newValues[valueIndex].stock = parseInt(e.target.value);
                  updateDropdownOption(index, "values", newValues);
                }}
              />
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

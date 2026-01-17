"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCurrency } from "@/hooks/useCurrency";

interface ProductOption {
  label: string;
  values: {
    name: string;
    description?: string; // Optional description for the option value
    price?: number;
    stock: number;
  }[];
}

interface ProductOptionSelectorProps {
  options: ProductOption[];
  basePrice: number;
  baseStock: number;
  currency: string;
  onSelectionChange: (selectedOptions: Record<string, string>, totalPrice: number) => void;
}

export default function ProductOptionSelector({
  options,
  basePrice,
  baseStock,
  currency,
  onSelectionChange,
}: ProductOptionSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [totalPrice, setTotalPrice] = useState(basePrice);
  const [formattedPrices, setFormattedPrices] = useState<Record<string, string>>({});
  const [formattedTotalPrice, setFormattedTotalPrice] = useState<string>("");
  const { formatPrice } = useCurrency();

  // Calculate total price based on selected options
  useEffect(() => {
    let calculatedPrice = basePrice;
    
    // Add price adjustments from selected options
    options.forEach(option => {
      const selectedValue = selectedOptions[option.label];
      if (selectedValue && selectedValue !== "Standard") {
        const optionValue = option.values.find(v => v.name === selectedValue);
        if (optionValue?.price) {
          calculatedPrice += optionValue.price;
        }
      }
      // If "Standard" is selected, no price adjustment is added
    });

    setTotalPrice(calculatedPrice);
    onSelectionChange(selectedOptions, calculatedPrice);
  }, [selectedOptions, basePrice, options, onSelectionChange]);

  // Format prices asynchronously
  useEffect(() => {
    const updateFormattedPrices = async () => {
      try {
        // Format all option prices
        const pricePromises = options.flatMap(option =>
          option.values
            .filter(value => value.price && value.price > 0)
            .map(async (value) => {
              const formatted = await formatPrice(value.price!, true);
              return { key: `${option.label}-${value.name}`, formatted };
            })
        );

        const formattedResults = await Promise.all(pricePromises);
        const priceMap: Record<string, string> = {};
        formattedResults.forEach(({ key, formatted }) => {
          priceMap[key] = formatted;
        });

        setFormattedPrices(priceMap);

        // Format total price
        const totalFormatted = await formatPrice(totalPrice, true);
        setFormattedTotalPrice(totalFormatted);
      } catch (error) {
        console.error('Error formatting prices:', error);
      }
    };

    updateFormattedPrices();
  }, [options, totalPrice, formatPrice]);

  const handleOptionChange = (optionLabel: string, valueName: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionLabel]: valueName
    }));
  };

  const getAvailableStock = () => {
    // If no options are selected, return base stock
    if (Object.keys(selectedOptions).length === 0) {
      return null;
    }

    // Find the stock for the selected option combination
    for (const option of options) {
      const selectedValue = selectedOptions[option.label];
      if (selectedValue) {
        // If "Standard" is selected, return base stock
        if (selectedValue === "Standard") {
          return baseStock;
        }
        
        const optionValue = option.values.find(v => v.name === selectedValue);
        if (optionValue) {
          return optionValue.stock;
        }
      }
    }
    return null;
  };

  const isOptionInStock = (optionValue: { name: string; stock: number }) => {
    return optionValue.stock > 0;
  };

  if (!options || options.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Product Options</h3>
      
      {options.map((option) => (
        <div key={option.label} className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            {option.label}
          </Label>
          <div className="flex flex-wrap gap-2">
            {/* Standard option - base price, no adjustments */}
            <Button
              key="Standard"
              variant={selectedOptions[option.label] === "Standard" ? "default" : "outline"}
              size="sm"
              onClick={() => handleOptionChange(option.label, "Standard")}
              className={`min-w-[80px] ${
                selectedOptions[option.label] === "Standard"
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="text-center">
                <div className="font-medium">Standard</div>
                <div className="text-xs opacity-75">Base Price</div>
              </div>
            </Button>
            
            {/* Other option values */}
            {option.values.map((value) => (
              <Button
                key={value.name}
                variant={selectedOptions[option.label] === value.name ? "default" : "outline"}
                size="sm"
                onClick={() => handleOptionChange(option.label, value.name)}
                disabled={!isOptionInStock(value)}
                className={`min-w-[80px] ${
                  selectedOptions[option.label] === value.name
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "hover:bg-gray-50"
                } ${
                  !isOptionInStock(value) ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <div className="text-center">
                  <div className="font-medium">{value.name}</div>
                  {value.price && value.price !== 0 && (
                    <div className="text-xs opacity-75">
                      +{formattedPrices[`${option.label}-${value.name}`] || `$${(value.price / 100).toFixed(2)}`}
                    </div>
                  )}
                  {!isOptionInStock(value) && (
                    <div className="text-xs text-red-500">Out of Stock</div>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </div>
      ))}

      {/* Display selected option descriptions */}
      {Object.keys(selectedOptions).length > 0 && (
        <div className="pt-4 space-y-3">
          {options.map((option) => {
            const selectedValue = selectedOptions[option.label];
            if (!selectedValue || selectedValue === "Standard") return null;
            
            const optionValue = option.values.find(v => v.name === selectedValue);
            if (!optionValue?.description) return null;
            
            return (
              <div key={option.label} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="text-sm font-medium text-purple-900 mb-1">
                  {option.label}: {optionValue.name}
                </div>
                <div className="text-sm text-purple-700">
                  {optionValue.description}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Display total price if options are selected */}
      {Object.keys(selectedOptions).length > 0 && (
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total Price:</span>
            <span className="text-lg font-semibold text-gray-900">
              {formattedTotalPrice || `$${(totalPrice / 100).toFixed(2)}`}
            </span>
          </div>
          {getAvailableStock() !== null && (
            <div className="text-sm text-gray-600 mt-1">
              Stock: {getAvailableStock()} available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import * as React from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, Sparkles, Plus, Search } from "lucide-react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { ProductSchema } from "@/schemas/ProductSchema";
import { z } from "zod";
import {
  suggestAttributes,
  AttributeSuggestions,
} from "@/lib/attribute-suggestions";
import {
  ATTRIBUTE_DICTIONARY,
  getAttributeTypes,
  normalizeAttributeValue,
} from "@/data/attribute-dictionary";

type ProductAttributesProps = {
  productName: string;
  description: string | { html?: string; text?: string } | null | undefined;
  primaryCategory?: string;
};

// Helper to capitalize first letter of each word
const capitalizeWords = (str: string): string => {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function ProductAttributes({
  productName,
  description,
  primaryCategory,
}: ProductAttributesProps) {
  const { control, watch, setValue } =
    useFormContext<z.infer<typeof ProductSchema>>();

  // State for suggestions
  const [suggestions, setSuggestions] = useState<AttributeSuggestions>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Watch secondary category for category-based suggestions
  const secondaryCategory = watch("secondaryCategory");

  // Generate suggestions when name, description, or category changes
  useEffect(() => {
    if (productName && productName.trim().length > 0) {
      const newSuggestions = suggestAttributes(
        productName,
        description,
        primaryCategory,
        secondaryCategory
      );
      setSuggestions(newSuggestions);
      // Auto-show suggestions if we have any
      if (Object.keys(newSuggestions).length > 0) {
        setShowSuggestions(true);
      }
    } else {
      setSuggestions({});
      setShowSuggestions(false);
    }
  }, [productName, description, primaryCategory, secondaryCategory]);

  // Get attribute types from dictionary
  const attributeTypes = getAttributeTypes();

  // Check if we have any suggestions
  const hasSuggestions = Object.keys(suggestions).length > 0;

  // Filter attributes based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      return {};
    }

    const query = normalizeAttributeValue(searchQuery);
    const results: Record<string, string[]> = {};

    // Search across all attribute types
    for (const type of attributeTypes) {
      const values = ATTRIBUTE_DICTIONARY[type] || [];
      const matches = values.filter((value) =>
        normalizeAttributeValue(value).includes(query)
      );

      if (matches.length > 0) {
        results[type] = matches;
      }
    }

    return results;
  }, [searchQuery, attributeTypes]);

  const hasSearchResults = Object.keys(searchResults).length > 0;

  // Watch attributes to ensure we have the latest value
  const watchedAttributes = watch("attributes");
  
  // Debug: log attributes when they're loaded (only once to avoid spam)
  useEffect(() => {
    if (watchedAttributes && typeof watchedAttributes === 'object' && !Array.isArray(watchedAttributes) && watchedAttributes !== null) {
      console.log("[ProductAttributes] Attributes loaded from form:", watchedAttributes);
    }
  }, [watchedAttributes]); // Re-run when attributes change

  return (
    <FormField
      control={control}
      name="attributes"
      render={({ field }) => {
        // Use field.value as the source of truth, fallback to watched value
        // This ensures we get the value even if field.value hasn't been set yet
        const fieldValue = field.value || watchedAttributes;
        const currentAttributes = (
          fieldValue && 
          typeof fieldValue === 'object' && 
          !Array.isArray(fieldValue) &&
          fieldValue !== null
            ? fieldValue 
            : {}
        ) as Record<string, string[]>;
        
        // Debug: log current attributes to help diagnose the issue
        // Only log when we actually have attributes to avoid console spam
        if (Object.keys(currentAttributes).length > 0) {
          console.log("[ProductAttributes] Current attributes for display:", currentAttributes);
          // Log each attribute type and its values for debugging
          Object.entries(currentAttributes).forEach(([type, values]) => {
            if (Array.isArray(values) && values.length > 0) {
              console.log(`[ProductAttributes] ${type}:`, values);
            }
          });
        } else if (watchedAttributes && typeof watchedAttributes === 'object') {
          console.log("[ProductAttributes] Watched attributes exist but currentAttributes is empty. field.value:", field.value, "watchedAttributes:", watchedAttributes);
        }
        
        // Check if we have any current attributes
        const hasAttributes = Object.keys(currentAttributes).some(
          (key) => currentAttributes[key]?.length > 0
        );
        
        // Sync function that updates both setValue and field.onChange
        const updateAttributes = (updated: Record<string, string[]>) => {
          setValue("attributes", updated, { shouldValidate: true });
          field.onChange(updated); // Also update the field directly
        };

        // Handle adding a suggested attribute
        const handleAddSuggestion = (
          attributeType: keyof AttributeSuggestions,
          value: string
        ) => {
          const normalized = normalizeAttributeValue(value);
          const current = currentAttributes[attributeType] || [];

          // Check if already exists
          if (current.map(normalizeAttributeValue).includes(normalized)) {
            return;
          }

          // Add to current attributes
          const updated = {
            ...currentAttributes,
            [attributeType]: [...current, normalized],
          };

          updateAttributes(updated);
        };

        // Handle removing an attribute
        const handleRemoveAttribute = (
          attributeType: keyof AttributeSuggestions,
          value: string
        ) => {
          const current = currentAttributes[attributeType] || [];
          const normalized = normalizeAttributeValue(value);

          const updated = {
            ...currentAttributes,
            [attributeType]: current.filter(
              (v: string) => normalizeAttributeValue(v) !== normalized
            ),
          };

          // Remove attribute type if empty
          if (updated[attributeType].length === 0) {
            delete updated[attributeType];
          }

          updateAttributes(updated);
        };

        return (
          <FormItem>
            <div className="space-y-4">
              {/* Search Section */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Search Attributes
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search for attributes (e.g., wool, large, blue, crochet...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {searchQuery && searchQuery.trim().length >= 2 && (
                  <p className="text-xs text-muted-foreground">
                    {hasSearchResults
                      ? `Found ${Object.values(searchResults).reduce((sum, arr) => sum + arr.length, 0)} matching attribute${Object.values(searchResults).reduce((sum, arr) => sum + arr.length, 0) !== 1 ? "s" : ""}`
                      : "No attributes found matching your search"}
                  </p>
                )}
              </div>

              {/* Search Results */}
              {hasSearchResults && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-green-600" />
                    <Label className="text-sm font-semibold text-green-900">
                      Search Results
                    </Label>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(searchResults).map(([type, values]) => {
                      if (!values || values.length === 0) return null;

                      const attributeType = type as keyof AttributeSuggestions;
                      const currentValues =
                        currentAttributes[attributeType] || [];

                      return (
                        <div key={type} className="space-y-2">
                          <Label className="text-xs font-medium text-green-800">
                            {capitalizeWords(type)}:
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {values.map((value: string) => {
                              const normalized = normalizeAttributeValue(value);
                              const isSelected = currentValues
                                .map(normalizeAttributeValue)
                                .includes(normalized);

                              return (
                                <Badge
                                  key={value}
                                  variant={isSelected ? "default" : "outline"}
                                  className={`cursor-pointer transition-colors ${
                                    isSelected
                                      ? "bg-green-600 hover:bg-green-700"
                                      : "hover:bg-green-100 hover:border-green-300"
                                  }`}
                                  onClick={() => {
                                    if (isSelected) {
                                      handleRemoveAttribute(attributeType, value);
                                    } else {
                                      handleAddSuggestion(attributeType, value);
                                    }
                                  }}
                                >
                                  {capitalizeWords(value)}
                                  {isSelected && <X className="h-3 w-3 ml-1" />}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Show Suggestions Button - appears when suggestions are hidden */}
              {hasSuggestions && !showSuggestions && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      <Label className="text-sm font-medium text-purple-900">
                        We found suggested attributes for your product
                      </Label>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSuggestions(true)}
                      className="h-7 px-3 text-xs"
                    >
                      Show Suggestions
                    </Button>
                  </div>
                </div>
              )}

              {/* Suggested Attributes Section */}
              {hasSuggestions && showSuggestions && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      <Label className="text-sm font-semibold text-purple-900">
                        Suggested attributes based on your product
                      </Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSuggestions(false)}
                      className="h-6 px-2 text-xs"
                    >
                      Hide
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(suggestions).map(([type, values]) => {
                      if (!values || values.length === 0) return null;

                      const attributeType = type as keyof AttributeSuggestions;
                      const currentValues =
                        currentAttributes[attributeType] || [];

                      return (
                        <div key={type} className="space-y-2">
                          <Label className="text-xs font-medium text-purple-800">
                            {capitalizeWords(type)}:
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {values.map((value: string) => {
                              const normalized = normalizeAttributeValue(value);
                              const isSelected = currentValues
                                .map(normalizeAttributeValue)
                                .includes(normalized);

                              return (
                                <Badge
                                  key={value}
                                  variant={isSelected ? "default" : "outline"}
                                  className={`cursor-pointer transition-colors ${
                                    isSelected
                                      ? "bg-purple-600 hover:bg-purple-700"
                                      : "hover:bg-purple-100 hover:border-purple-300"
                                  }`}
                                  onClick={() => {
                                    if (isSelected) {
                                      handleRemoveAttribute(attributeType, value);
                                    } else {
                                      handleAddSuggestion(attributeType, value);
                                    }
                                  }}
                                >
                                  {capitalizeWords(value)}
                                  {isSelected && <X className="h-3 w-3 ml-1" />}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Current Attributes Display */}
              {hasAttributes && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">
                    Current Attributes
                  </Label>
                  {attributeTypes.map((type) => {
                    const values = currentAttributes[type] || [];
                    if (values.length === 0) return null;

                    return (
                      <div key={type} className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">
                          {capitalizeWords(type)}:
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {values.map((value: string) => (
                            <Badge
                              key={value}
                              variant="secondary"
                              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                              onClick={() => handleRemoveAttribute(type, value)}
                            >
                              {capitalizeWords(value)}
                              <X className="h-3 w-3 ml-1" />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Manual Add Section */}
              <div className="space-y-3 pt-2 border-t">
                <Label className="text-sm font-semibold">
                  Add Attributes Manually
                </Label>
                <div className="space-y-3">
                  {attributeTypes.map((type) => {
                    const current = currentAttributes[type] || [];
                    const availableValues = ATTRIBUTE_DICTIONARY[type] || [];

                    return (
                      <div key={type} className="space-y-2">
                        <Label className="text-xs font-medium">
                          {capitalizeWords(type)}
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {availableValues
                            .filter(
                              (value: string) =>
                                !current
                                  .map(normalizeAttributeValue)
                                  .includes(normalizeAttributeValue(value))
                            )
                            .slice(0, 10)
                            .map((value: string) => (
                              <Badge
                                key={value}
                                variant="outline"
                                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                onClick={() => handleAddSuggestion(type, value)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                {capitalizeWords(value)}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <FormControl>
              <input type="hidden" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

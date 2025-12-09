"use client";

import { useFormContext, UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QuillEditor } from "../QuillEditor";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "../ui/checkbox";
import { X, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Categories,
  getSecondaryCategories,
  getTertiaryCategories,
  SecondaryCategoryID,
  getCategoryChain,
  CategoryChain,
} from "@/data/categories";
import { CategoryKeywords } from "@/data/category-keywords";
import Fuse from "fuse.js";
import { checkSellerApproval } from "@/actions/check-seller-approval";
import { ProductSchema } from "@/schemas/ProductSchema";
import { z } from "zod";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Update the SUPPORTED_CURRENCIES to match the schema
const SUPPORTED_CURRENCIES = [
  { code: "USD", decimals: 2, symbol: "$", name: "US Dollar" },
  { code: "EUR", decimals: 2, symbol: "€", name: "Euro" },
  { code: "GBP", decimals: 2, symbol: "£", name: "British Pound" },
  { code: "CAD", decimals: 2, symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", decimals: 2, symbol: "A$", name: "Australian Dollar" },
  { code: "JPY", decimals: 0, symbol: "¥", name: "Japanese Yen" },
  { code: "INR", decimals: 2, symbol: "₹", name: "Indian Rupee" },
  { code: "SGD", decimals: 2, symbol: "S$", name: "Singapore Dollar" },
] as const;

type ProductInfoSectionProps = {
  form: ReturnType<typeof useFormContext<z.infer<typeof ProductSchema>>>;
  description: string;
  setDescription: (value: string) => void;
  tags: string[];
  setTags: (tags: string[]) => void;
  materialTags: string[];
  setMaterialTags: (tags: string[]) => void;
  shortDescriptionBullets: string[];
  setShortDescriptionBullets: (bullets: string[]) => void;
  showAdvancedOptions?: boolean;
};

export const ProductInfoSection = ({
  form,
  description,
  setDescription,
  tags,
  setTags,
  materialTags,
  setMaterialTags,
  shortDescriptionBullets,
  setShortDescriptionBullets,
  showAdvancedOptions = true,
}: ProductInfoSectionProps) => {
  const { register, control, setValue, watch } = form;
  const [isSellerApproved, setIsSellerApproved] = useState<boolean | null>(
    null
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  // Close tooltip on scroll and reset button state
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      if (tooltipOpen) {
        // Clear any pending timeouts
        clearTimeout(scrollTimeout);

        // Close tooltip immediately
        setTooltipOpen(false);

        // Reset button state after a brief delay to ensure state is cleared
        scrollTimeout = setTimeout(() => {
          if (buttonRef.current) {
            // Blur the button to remove focus/active state
            buttonRef.current.blur();
            // Force a state reset by toggling pointer events
            const originalPointerEvents = buttonRef.current.style.pointerEvents;
            buttonRef.current.style.pointerEvents = "none";
            // Use requestAnimationFrame to ensure the change is processed
            requestAnimationFrame(() => {
              if (buttonRef.current) {
                buttonRef.current.style.pointerEvents =
                  originalPointerEvents || "auto";
              }
            });
          }
        }, 50);
      }
    };

    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      clearTimeout(scrollTimeout);
    };
  }, [tooltipOpen]);

  const currentStatus = watch("status");
  const selectedCurrency = watch("currency") || "USD";
  const { data: session } = useSession();
  const currentUser = session?.user;

  // Get currency info for the selected currency
  const getCurrencyInfo = (currencyCode: string) => {
    return (
      SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode) ||
      SUPPORTED_CURRENCIES[0]
    );
  };

  const currencyInfo = getCurrencyInfo(selectedCurrency);

  useEffect(() => {
    const checkApproval = async () => {
      const approved = await checkSellerApproval();
      setIsSellerApproved(approved);
    };

    void checkApproval();
  }, []);

  const [tagInput, setTagInput] = useState("");
  const [materialTagInput, setMaterialTagInput] = useState("");
  const [bulletInput, setBulletInput] = useState("");
  const [categorySuggestions, setCategorySuggestions] = useState<
    CategoryChain[]
  >([]);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const productName = watch("name");

  // Initialize Fuse.js for category keyword search
  const fuse = useMemo(() => {
    return new Fuse(CategoryKeywords, {
      keys: ["keywords", "name"],
      threshold: 0.5, // Slightly more lenient for multi-word queries
      minMatchCharLength: 2,
      includeScore: true,
      findAllMatches: true, // Find matches across all words, not just the first
      ignoreLocation: true, // Don't penalize matches based on position in string
    });
  }, []);

  // Search for category suggestions based on product name
  useEffect(() => {
    if (!productName || productName.trim().length < 2) {
      setCategorySuggestions([]);
      return;
    }

    // Search with the full product name
    const fullResults = fuse.search(productName, { limit: 10 });

    // Also search individual words to catch cases like "pumpkin plushie" -> "plushie"
    const words = productName
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 2);
    const wordResults: typeof fullResults = [];

    if (words.length > 1) {
      // Search each word individually and combine results
      for (const word of words) {
        const wordSearch = fuse.search(word, { limit: 5 });
        wordResults.push(...wordSearch);
      }
    }

    // Combine and deduplicate results, prioritizing full matches
    const allResults = [...fullResults, ...wordResults];

    // Sort by score (lower is better) and remove duplicates
    const uniqueResults = new Map<string, (typeof fullResults)[0]>();
    for (const result of allResults) {
      const key = result.item.id;
      if (
        !uniqueResults.has(key) ||
        (uniqueResults.get(key)?.score ?? 1) > (result.score ?? 1)
      ) {
        uniqueResults.set(key, result);
      }
    }

    // Sort by score and take top results
    const sortedResults = Array.from(uniqueResults.values())
      .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
      .slice(0, 5);

    const suggestions: CategoryChain[] = [];

    // Convert search results to category chains
    for (const result of sortedResults) {
      const categoryId = result.item.id;
      const chain = getCategoryChain(categoryId);
      if (chain) {
        // Avoid duplicates
        const isDuplicate = suggestions.some(
          (s) =>
            s.primary.id === chain.primary.id &&
            s.secondary?.id === chain.secondary?.id &&
            s.tertiary?.id === chain.tertiary?.id
        );
        if (!isDuplicate) {
          suggestions.push(chain);
        }
      }
    }

    setCategorySuggestions(suggestions.slice(0, 5));
  }, [productName, fuse]);

  // Handle category suggestion click
  const handleCategorySuggestionClick = (chain: CategoryChain) => {
    // Set primary category first
    setValue("primaryCategory", chain.primary.id);

    // Clear suggestions immediately for better UX
    setCategorySuggestions([]);

    if (chain.secondary) {
      // Wait for secondary options to update, then set secondary
      setTimeout(() => {
        setValue("secondaryCategory", chain.secondary!.id);

        if (chain.tertiary) {
          // Wait for tertiary options to update, then set tertiary
          setTimeout(() => {
            setValue("tertiaryCategory", chain.tertiary!.id);
          }, 50);
        } else {
          // Clear tertiary if not needed
          setTimeout(() => {
            setValue("tertiaryCategory", "");
          }, 50);
        }
      }, 50);
    } else {
      // Clear secondary and tertiary if no secondary category
      setTimeout(() => {
        setValue("secondaryCategory", "");
        setValue("tertiaryCategory", "");
      }, 50);
    }
  };

  // Watch the primary and secondary category values
  const selectedPrimaryCategory = watch("primaryCategory");
  const selectedSecondaryCategory = watch("secondaryCategory");

  // Get secondary categories based on selected primary category
  const availableSecondaryCategories = selectedPrimaryCategory
    ? (() => {
        const primary = Categories.find(
          (cat) => cat.id === selectedPrimaryCategory
        );
        return primary
          ? primary.children.map((child) => ({
              id: child.id,
              name: child.name,
            }))
          : [];
      })()
    : [];

  // Get tertiary categories based on selected secondary category
  const availableTertiaryCategories = selectedSecondaryCategory
    ? (() => {
        const tertiaryIds = getTertiaryCategories(
          selectedSecondaryCategory as SecondaryCategoryID
        );
        const result: { id: string; name: string }[] = [];
        for (const id of tertiaryIds) {
          // Find the tertiary category by searching the tree
          for (const primary of Categories) {
            for (const secondary of primary.children) {
              if ("children" in secondary && secondary.children) {
                const tertiary = secondary.children.find((t) => t.id === id);
                if (tertiary) {
                  result.push({ id: tertiary.id, name: tertiary.name });
                  break;
                }
              }
            }
          }
        }
        return result;
      })()
    : [];

  // Add tag
  const addTag = () => {
    if (tagInput.trim() !== "" && !tags.includes(tagInput.trim())) {
      const updatedTags = [...tags, tagInput.trim()];
      setTags(updatedTags);
      setValue("tags", updatedTags);
      setTagInput("");
    }
  };

  // Add material tag
  const addMaterialTag = () => {
    if (materialTagInput.trim() && !materialTags.includes(materialTagInput)) {
      const updatedMaterialTags = [...materialTags, materialTagInput.trim()];
      setMaterialTags(updatedMaterialTags);
      setValue("materialTags", updatedMaterialTags);
      setMaterialTagInput("");
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove.toLowerCase());
    setTags(updatedTags);
    setValue("tags", updatedTags);
  };

  // Remove material tag
  const removeMaterialTag = (tagToRemove: string) => {
    const updatedMaterialTags = materialTags.filter(
      (tag) => tag !== tagToRemove.toLowerCase()
    );
    setMaterialTags(updatedMaterialTags);
    setValue("materialTags", updatedMaterialTags);
  };

  // Add bullet point
  const addBulletPoint = () => {
    if (
      bulletInput.trim() !== "" &&
      !shortDescriptionBullets.includes(bulletInput.trim()) &&
      shortDescriptionBullets.length < 5
    ) {
      const updatedBullets = [...shortDescriptionBullets, bulletInput.trim()];
      setShortDescriptionBullets(updatedBullets);
      setValue("shortDescriptionBullets", updatedBullets);
      setBulletInput("");
    }
  };

  // Remove bullet point
  const removeBulletPoint = (bulletToRemove: string) => {
    const updatedBullets = shortDescriptionBullets.filter(
      (bullet) => bullet !== bulletToRemove
    );
    setShortDescriptionBullets(updatedBullets);
    setValue("shortDescriptionBullets", updatedBullets);
  };

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      {/* Product Name */}
      <FormField
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Product Name</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Product name"
                {...field}
                rows={2}
                className={
                  fieldState.error
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Product Description */}
      <FormField
        control={control}
        name="description"
        render={({ fieldState }) => {
          // Only show error if status is not DRAFT
          const shouldShowError = currentStatus !== "DRAFT" && fieldState.error;
          return (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <div
                  className={
                    shouldShowError ? "border border-red-500 rounded-md" : ""
                  }
                >
                  <QuillEditor
                    value={description}
                    onChange={setDescription}
                    placeholder="Enter product description..."
                  />
                </div>
              </FormControl>
              {shouldShowError && <FormMessage />}
            </FormItem>
          );
        }}
      />

      {/* Price */}
      <FormField
        control={control}
        name="price"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Price</FormLabel>
            <FormControl>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {currencyInfo.symbol}
                </span>
                <Input
                  type="number"
                  step={1 / Math.pow(10, currencyInfo.decimals)}
                  min={1 / Math.pow(10, currencyInfo.decimals)}
                  placeholder="Price"
                  className={`pl-8 ${fieldState.error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  {...field}
                  value={field.value || ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseFloat(e.target.value) : 0
                    )
                  }
                />
              </div>
            </FormControl>
            <p className="text-sm text-muted-foreground">
              {currencyInfo.decimals === 0
                ? "Enter whole numbers only (no decimal places)"
                : `Enter price with up to ${currencyInfo.decimals} decimal places`}
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Category Suggestions */}
      {categorySuggestions.length > 0 && (
        <div className="w-full min-w-0 max-w-full space-y-2 p-3 bg-purple-50 border border-purple-200 rounded-md">
          <p className="text-sm font-medium text-purple-900 break-words">
            Suggested Categories:
          </p>
          <div className="space-y-1 w-full min-w-0 max-w-full">
            {categorySuggestions.map((chain, index) => {
              const chainText = [
                chain.primary.name,
                chain.secondary?.name,
                chain.tertiary?.name,
              ]
                .filter(Boolean)
                .join(" > ");
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleCategorySuggestionClick(chain)}
                  className="block w-full min-w-0 max-w-full text-left px-3 py-2 text-sm bg-white hover:bg-purple-100 border border-purple-300 rounded-md transition-colors"
                >
                  <span className="text-purple-800 block truncate w-full" title={chainText}>
                    {chainText}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-purple-700 break-words">
            Click a suggestion to auto-fill the category fields below
          </p>
        </div>
      )}

      {/* Primary Category */}
      <FormField
        control={control}
        name="primaryCategory"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Primary Category</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <FormControl>
                <SelectTrigger
                  className={
                    fieldState.error ? "border-red-500 focus:ring-red-500" : ""
                  }
                >
                  <SelectValue placeholder="Select primary category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {Categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Secondary Categories */}
      <FormField
        control={control}
        name="secondaryCategory"
        render={({ field, fieldState }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Secondary Categories</FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                // Clear tertiary category when secondary changes
                setValue("tertiaryCategory", "");
              }}
              value={field.value || ""}
              disabled={!selectedPrimaryCategory}
            >
              <FormControl>
                <SelectTrigger
                  className={
                    fieldState.error ? "border-red-500 focus:ring-red-500" : ""
                  }
                >
                  <SelectValue
                    placeholder={
                      selectedPrimaryCategory
                        ? "Select secondary category"
                        : "Select a primary category first"
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {availableSecondaryCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Tertiary Categories (Optional) */}
      {availableTertiaryCategories.length > 0 && (
        <FormField
          control={control}
          name="tertiaryCategory"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Tertiary Category (Optional)</FormLabel>
              <Select
                onValueChange={(value) => {
                  // Convert "none" to empty string for the form
                  field.onChange(value === "none" ? "" : value);
                }}
                defaultValue={field.value || "none"}
                value={field.value || "none"}
                disabled={!selectedSecondaryCategory}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tertiary category (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {availableTertiaryCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Adding a tertiary category helps buyers find your product more
                easily
              </p>
            </FormItem>
          )}
        />
      )}

      {/* Product Status */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-lg font-semibold">Product Status</Label>
          <TooltipProvider delayDuration={300} skipDelayDuration={0}>
            <Tooltip
              open={tooltipOpen}
              onOpenChange={(open) => {
                setTooltipOpen(open);
                // Reset button state when tooltip closes
                if (!open && buttonRef.current) {
                  buttonRef.current.blur();
                }
              }}
              disableHoverableContent
            >
              <TooltipTrigger asChild>
                <button
                  ref={buttonRef}
                  type="button"
                  className="text-gray-400 hover:text-gray-600 active:text-gray-800 transition-colors touch-manipulation"
                  aria-label="Product status help"
                  onClick={(e) => {
                    // Prevent form submission when clicking the help button
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                className="max-w-xs"
                side="top"
                sideOffset={8}
                align="start"
                avoidCollisions={true}
                collisionPadding={8}
              >
                <div className="space-y-2 text-sm">
                  <div>
                    <strong className="text-purple-600">Draft:</strong> Save
                    your product with incomplete information. Not visible on the
                    site. You can come back anytime to finish it.
                  </div>
                  <div>
                    <strong className="text-purple-600">Hidden:</strong> A
                    completed product that won&apos;t show on the site. All
                    required fields must be filled.
                  </div>
                  <div>
                    <strong className="text-purple-600">Active:</strong> A
                    completed product that is live and shown on the site for
                    purchase. All required fields must be filled.
                  </div>
                  <div>
                    <strong className="text-purple-600">Disabled:</strong> A
                    completed product that is temporarily disabled. All required
                    fields must be filled.
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <RadioGroup
          value={currentStatus || "DRAFT"}
          onValueChange={(value) => form.setValue("status", value)}
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="DRAFT"
              id="draft"
              className="text-purple-600"
            />
            <Label htmlFor="draft" className="text-base">
              Draft
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="HIDDEN"
              id="hidden"
              className="text-purple-600"
            />
            <Label htmlFor="hidden" className="text-base">
              Hidden
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="ACTIVE"
              id="active"
              className="text-purple-600"
              disabled={isSellerApproved === null || !isSellerApproved}
            />
            <Label
              htmlFor="active"
              className={`text-base ${isSellerApproved === null || !isSellerApproved ? "text-gray-400" : ""}`}
            >
              Active
              {(isSellerApproved === null || !isSellerApproved) && (
                <span className="ml-2 text-sm text-gray-500">
                  (Available after approval)
                </span>
              )}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="DISABLED"
              id="disabled"
              className="text-purple-600"
              disabled={isSellerApproved === null || !isSellerApproved}
            />
            <Label
              htmlFor="disabled"
              className={`text-base ${isSellerApproved === null || !isSellerApproved ? "text-gray-400" : ""}`}
            >
              Disabled
              {(isSellerApproved === null || !isSellerApproved) && (
                <span className="ml-2 text-sm text-gray-500">
                  (Available after approval)
                </span>
              )}
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Is Product Digital or Physical */}
      <FormField
        control={control}
        name="isDigital"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked === true);
                    // Automatically update tax category based on isDigital
                    form.setValue(
                      "taxCategory",
                      checked ? "DIGITAL_GOODS" : "PHYSICAL_GOODS"
                    );
                  }}
                />
              </FormControl>
              <FormLabel className="!mt-0">Is this product digital?</FormLabel>
            </div>
          </FormItem>
        )}
      />

      {/* Advanced Options - Collapsible Section */}
      {showAdvancedOptions && (
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <CollapsibleTrigger className="w-full flex items-center justify-between py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
          <span className="text-sm font-medium text-gray-700">
            Advanced Options
          </span>
          {isAdvancedOpen ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-10 mt-6 px-1">
          {/* SKU */}
          <FormField
            control={control}
            name="sku"
            render={({ field }) => (
              <div className="flex flex-col gap-y-3 pb-6">
                <Label className="text-sm font-medium">
                  SKU (Stock Keeping Unit)
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Leave blank to auto-generate"
                    {...register("sku")}
                    className="flex-1"
                  />
                  <TooltipProvider delayDuration={300} skipDelayDuration={0}>
                    <Tooltip
                      open={tooltipOpen && !watch("name")}
                      onOpenChange={setTooltipOpen}
                      disableHoverableContent
                    >
                      <TooltipTrigger asChild>
                        <div>
                          <Button
                            ref={buttonRef}
                            type="button"
                            variant="outline"
                            onClick={async (e) => {
                              const productName = watch("name");
                              if (!productName) {
                                e.preventDefault();
                                e.stopPropagation();
                                toast.error(
                                  "Please enter a product name first"
                                );
                                return;
                              }

                              try {
                                const response = await fetch(
                                  "/api/products/generate-sku",
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({ productName }),
                                  }
                                );

                                if (!response.ok) {
                                  const errorData = await response.json();
                                  throw new Error(
                                    errorData.error || "Failed to generate SKU"
                                  );
                                }

                                const data = await response.json();
                                setValue("sku", data.sku);
                                toast.success("SKU generated successfully!");
                              } catch (error) {
                                console.error("Error generating SKU:", error);
                                toast.error(
                                  error instanceof Error
                                    ? error.message
                                    : "Failed to generate SKU"
                                );
                              }
                            }}
                            disabled={!watch("name")}
                            onMouseEnter={() => {
                              if (!watch("name")) {
                                setTooltipOpen(true);
                              }
                            }}
                            onMouseLeave={() => {
                              setTooltipOpen(false);
                            }}
                          >
                            Generate
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        className="max-w-xs"
                        side="top"
                        sideOffset={8}
                        align="start"
                        avoidCollisions={true}
                        collisionPadding={8}
                      >
                        <p className="text-sm">
                          Please enter a product name first to generate a SKU
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  SKU helps you track inventory. Leave blank to auto-generate,
                  or enter your own.
                </p>
              </div>
            )}
          />

          {/* Currency */}
          <div className="flex flex-col gap-y-3 pb-6">
            <Label className="text-sm font-medium">Currency</Label>
            <FormField
              control={control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || "USD"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SUPPORTED_CURRENCIES.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          {/* Short Description */}
          <FormField
            control={control}
            name="shortDescription"
            render={({ field, fieldState }) => (
              <FormItem className="space-y-3 pb-6">
                <FormLabel className="text-sm font-medium">
                  Short Description
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Brief description about your product"
                    {...field}
                    className={
                      fieldState.error
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  A short description that will appear under your shop name on
                  the product page.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Short Description Bullet Points */}
          <div className="flex flex-col gap-y-3 pb-6">
            <Label className="text-sm font-medium">
              Bullet Points (Optional)
            </Label>
            <div className="flex space-x-2">
              <Input
                value={bulletInput}
                onChange={(e) => setBulletInput(e.target.value)}
                placeholder="Enter a bullet point..."
                disabled={shortDescriptionBullets.length >= 5}
              />
              <Button
                onClick={addBulletPoint}
                type="button"
                disabled={
                  !bulletInput.trim() || shortDescriptionBullets.length >= 5
                }
                variant="outline"
              >
                Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Add up to 5 bullet points to highlight key features. These will
              appear below the short description on the product page.
            </p>
            {shortDescriptionBullets.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Current bullet points:
                </p>
                <div className="space-y-1">
                  {shortDescriptionBullets.map((bullet, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md border"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500 text-sm">•</span>
                        <span className="text-sm text-gray-800">{bullet}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBulletPoint(bullet)}
                        aria-label={`Remove bullet point: ${bullet}`}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Product Tags */}
          <div className="flex flex-col gap-y-3 pb-6">
            <Label className="text-sm font-medium">Product Tags</Label>
            <div className="flex space-x-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Enter a tag..."
              />
              <Button
                onClick={addTag}
                type="button"
                disabled={!tagInput.trim()}
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center px-2 py-1 text-sm bg-gray-100 rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      aria-label={`Remove tag ${tag}`}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Material Tags */}
          <div className="flex flex-col gap-y-3 pb-6">
            <Label className="text-sm font-medium">Material Tags</Label>
            <div className="flex space-x-2">
              <Input
                value={materialTagInput}
                onChange={(e) => setMaterialTagInput(e.target.value)}
                placeholder="Enter a material tag..."
              />
              <Button
                onClick={addMaterialTag}
                type="button"
                disabled={!materialTagInput.trim()}
              >
                Add
              </Button>
            </div>
            {materialTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {materialTags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center px-2 py-1 text-sm bg-gray-100 rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeMaterialTag(tag)}
                      aria-label={`Remove material tag ${tag}`}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tax Settings */}
          <div className="space-y-6 pb-2">
            <FormField
              control={control}
              name="taxCategory"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-sm font-medium">
                    Tax Category
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tax category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PHYSICAL_GOODS">
                        Physical Goods
                      </SelectItem>
                      <SelectItem value="DIGITAL_GOODS">
                        Digital Goods
                      </SelectItem>
                      <SelectItem value="SERVICES">Services</SelectItem>
                      <SelectItem value="SHIPPING">Shipping</SelectItem>
                      <SelectItem value="HANDLING">Handling</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {watch("isDigital")
                      ? "Automatically set to Digital Goods based on product type"
                      : "Automatically set to Physical Goods based on product type"}
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="taxExempt"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-medium">
                      Tax Exempt
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Check this if your product is tax exempt (e.g.,
                      educational materials, certain medical supplies)
                    </p>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
      )}
    </div>
  );
};

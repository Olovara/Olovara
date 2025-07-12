"use client";

import { useFormContext, UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { QuillEditor } from "../QuillEditor";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
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
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { CategoriesMap } from "@/data/categories";
import { checkSellerApproval } from "@/actions/check-seller-approval";
import { ProductSchema } from "@/schemas/ProductSchema";
import { z } from "zod";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

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
};

export const ProductInfoSection = ({
  form,
  description,
  setDescription,
  tags,
  setTags,
  materialTags,
  setMaterialTags,
}: ProductInfoSectionProps) => {
  const { register, control, setValue, watch } = useFormContext();
  const [isSellerApproved, setIsSellerApproved] = useState<boolean | null>(null);
  const currentStatus = watch("status");
  const selectedCurrency = watch("currency") || "USD";
  const { data: session } = useSession();
  const currentUser = session?.user;

  // Get currency info for the selected currency
  const getCurrencyInfo = (currencyCode: string) => {
    return SUPPORTED_CURRENCIES.find(c => c.code === currencyCode) || SUPPORTED_CURRENCIES[0];
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

  // Watch the primary and secondary category values
  const selectedPrimaryCategory = watch("primaryCategory");
  const selectedSecondaryCategory = watch("secondaryCategory");

  // Get secondary categories based on selected primary category
  const availableSecondaryCategories = selectedPrimaryCategory 
    ? CategoriesMap.SECONDARY.filter(category => 
        CategoriesMap.MAPPING[selectedPrimaryCategory as keyof typeof CategoriesMap.MAPPING]?.includes(category.id)
      )
    : [];

  // Get tertiary categories based on selected secondary category
  const availableTertiaryCategories = selectedSecondaryCategory 
    ? CategoriesMap.TERTIARY.filter(category => 
        category.secondaryCategoryId === selectedSecondaryCategory
      )
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

  return (
    <div className="space-y-6">
      {/* Product Name */}
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <div className="flex flex-col gap-y-2">
            <Label>Product Name</Label>
            <Input
              placeholder="Product name"
              {...register("name", { required: "Product name is required" })}
            />
          </div>
        )}
      />

      {/* SKU */}
      <FormField
        control={control}
        name="sku"
        render={({ field }) => (
          <div className="flex flex-col gap-y-2">
            <Label>SKU (Stock Keeping Unit)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Leave blank to auto-generate"
                {...register("sku")}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  const productName = watch("name");
                  if (!productName) {
                    toast.error("Please enter a product name first");
                    return;
                  }
                  
                  try {
                    // Import the function dynamically to avoid SSR issues
                    const { generateUniqueSKU } = await import("@/lib/sku-generator");
                    if (!currentUser?.id) {
                      toast.error("User not authenticated");
                      return;
                    }
                    const generatedSKU = await generateUniqueSKU(productName, currentUser.id);
                    setValue("sku", generatedSKU);
                    toast.success("SKU generated successfully!");
                  } catch (error) {
                    console.error("Error generating SKU:", error);
                    toast.error("Failed to generate SKU");
                  }
                }}
                disabled={!watch("name")}
              >
                Generate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              SKU helps you track inventory. Leave blank to auto-generate, or enter your own.
            </p>
          </div>
        )}
      />

      {/* Product Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <QuillEditor
          value={description}
          onChange={setDescription}
          placeholder="Enter product description..."
        />
      </div>

      {/* Price and Currency */}
      <div className="space-y-4">
        <div className="flex flex-col gap-y-2">
          <Label>Currency</Label>
          <FormField
            control={control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || "USD"}
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

        <div className="flex flex-col gap-y-2">
          <Label>Price</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              {currencyInfo.symbol}
            </span>
            <Input
              type="number"
              step={1 / Math.pow(10, currencyInfo.decimals)}
              min={1 / Math.pow(10, currencyInfo.decimals)}
              placeholder="Price"
              className="pl-8"
              {...register("price", {
                valueAsNumber: true,
                required: "Price is required",
              })}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {currencyInfo.decimals === 0 
              ? "Enter whole numbers only (no decimal places)"
              : `Enter price with up to ${currencyInfo.decimals} decimal places`}
          </p>
        </div>
      </div>

      {/* Primary Category */}
      <FormField
        control={control}
        name="primaryCategory"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Primary Category</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value || ""}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select primary category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {CategoriesMap.PRIMARY.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      {/* Secondary Categories */}
      <FormField
        control={control}
        name="secondaryCategory"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Secondary Categories</FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                // Clear tertiary category when secondary changes
                setValue("tertiaryCategory", "");
              }}
              defaultValue={field.value || ""}
              disabled={!selectedPrimaryCategory}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={selectedPrimaryCategory ? "Select secondary category" : "Select a primary category first"} />
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
                Adding a tertiary category helps buyers find your product more easily
              </p>
            </FormItem>
          )}
        />
      )}

      {/* Product Status */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Product Status</Label>
        <RadioGroup
          value={currentStatus || "HIDDEN"}
          onValueChange={(value) => form.setValue("status", value)}
          className="flex flex-col space-y-2"
        >
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
              className={`text-base ${isSellerApproved === null || !isSellerApproved ? 'text-gray-400' : ''}`}
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
              className={`text-base ${isSellerApproved === null || !isSellerApproved ? 'text-gray-400' : ''}`}
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
          <FormItem className="flex flex-row items-start space-x-3">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked === true);
                  // Automatically update tax category based on isDigital
                  form.setValue("taxCategory", checked ? "DIGITAL_GOODS" : "PHYSICAL_GOODS");
                }}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Is this product digital?</FormLabel>
            </div>
          </FormItem>
        )}
      />

      {/* Product Tags */}
      <div className="flex flex-col gap-y-2">
        <Label>Product Tags</Label>
        <div className="flex space-x-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Enter a tag..."
          />
          <Button onClick={addTag} type="button" disabled={!tagInput.trim()}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
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
      </div>

      {/* Material Tags */}
      <div className="flex flex-col gap-y-2">
        <Label>Material Tags</Label>
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
        <div className="flex flex-wrap gap-2 mt-2">
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
      </div>

      {/* Tax Settings */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Tax Settings</Label>
        
        <FormField
          control={control}
          name="taxCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax Category</FormLabel>
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
                  <SelectItem value="PHYSICAL_GOODS">Physical Goods</SelectItem>
                  <SelectItem value="DIGITAL_GOODS">Digital Goods</SelectItem>
                  <SelectItem value="SERVICES">Services</SelectItem>
                  <SelectItem value="SHIPPING">Shipping</SelectItem>
                  <SelectItem value="HANDLING">Handling</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
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
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Tax Exempt</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Check this if your product is tax exempt (e.g., educational materials, certain medical supplies)
                </p>
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

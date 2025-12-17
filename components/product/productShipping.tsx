"use client";

import { useFormContext, UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  SUPPORTED_WEIGHT_UNITS,
  SUPPORTED_DIMENSION_UNITS,
  WeightUnit,
  DimensionUnit,
} from "@/data/units";
import { z } from "zod";
import { ProductSchema } from "@/schemas/ProductSchema";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Truck, ChevronDown, ChevronUp } from "lucide-react";
import ShippingOptionModal from "@/components/onboarding/ShippingOptionModal";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type ProductFormValues = z.infer<typeof ProductSchema>;

interface ShippingOption {
  id: string;
  name: string;
  isDefault: boolean;
  defaultShipping: number | null; // Price in cents
  defaultShippingCurrency: string;
  rates: {
    zone: string;
    price: number;
    currency: string;
    estimatedDays: number;
    additionalItem?: number;
    serviceLevel?: string;
    isFreeShipping: boolean;
  }[];
}

interface ProductShippingSectionProps {
  form: UseFormReturn<ProductFormValues>;
  freeShipping: boolean;
  showAdvancedOptions?: boolean;
  sellerId?: string | null; // For admin creating product for seller
}

export const ProductShippingSection = ({
  form,
  freeShipping,
  showAdvancedOptions = true,
  sellerId,
}: ProductShippingSectionProps) => {
  const { control, watch, setValue } = form;
  const isDigital = watch("isDigital");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const selectedOptionId = watch("shippingOptionId");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Fetch shipping options when component mounts
  const fetchShippingOptions = useCallback(
    async (newShippingOptionId?: string) => {
      try {
        // Include sellerId param if admin is creating for a seller
        const url = sellerId
          ? `/api/shipping-options?sellerId=${sellerId}`
          : "/api/shipping-options";
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch shipping options");
        const data = await response.json();
        setShippingOptions(data);

        // Auto-select the newly created shipping option
        if (newShippingOptionId && !selectedOptionId) {
          setValue("shippingOptionId", newShippingOptionId);
        }
      } catch (error) {
        console.error("Error fetching shipping options:", error);
      }
    },
    [selectedOptionId, setValue, sellerId]
  );

  useEffect(() => {
    void fetchShippingOptions();
  }, [fetchShippingOptions, sellerId]);

  // Ensure shippingOptionId is preserved when shipping options load
  // This fixes the issue where editing a product doesn't show the selected shipping option
  useEffect(() => {
    if (shippingOptions.length > 0) {
      const currentShippingOptionId = watch("shippingOptionId");
      if (currentShippingOptionId) {
        // Verify the option exists in the loaded options
        const optionExists = shippingOptions.some(
          (option) => option.id === currentShippingOptionId
        );
        if (optionExists) {
          // Explicitly set the value to ensure Select component recognizes it
          // This is necessary because the Select might not have recognized the value
          // when it was set before the options were loaded
          setValue("shippingOptionId", currentShippingOptionId, {
            shouldValidate: false,
          });
        }
      }
    }
  }, [shippingOptions, watch, setValue]);

  // Don't auto-select default shipping option - let user choose
  // This ensures validation works correctly for required fields

  // Ensure shipping cost is 0 when free shipping is selected
  useEffect(() => {
    if (freeShipping) {
      setValue("shippingCost", 0);
    }
  }, [freeShipping, setValue]);

  // Populate shipping cost when a shipping option is selected
  useEffect(() => {
    if (selectedOptionId && !freeShipping) {
      // Find the selected shipping option
      const selectedOption = shippingOptions.find(
        (option) => option.id === selectedOptionId
      );

      if (selectedOption) {
        // Use defaultShipping if available (convert from cents to dollars)
        // Otherwise use the first rate's price as fallback
        let defaultShippingCost = 0;

        if (
          selectedOption.defaultShipping !== null &&
          selectedOption.defaultShipping !== undefined
        ) {
          // Convert from cents to dollars based on currency decimals
          // For now, assume 2 decimals (most currencies)
          defaultShippingCost = selectedOption.defaultShipping / 100;
        } else if (selectedOption.rates && selectedOption.rates.length > 0) {
          // Fallback to first rate's price (already in cents, convert to dollars)
          defaultShippingCost = selectedOption.rates[0].price / 100;
        }

        // Only set if shippingCost is currently 0 or undefined
        const currentShippingCost = watch("shippingCost");
        if (!currentShippingCost || currentShippingCost === 0) {
          setValue("shippingCost", defaultShippingCost);
        }
      }
    }
  }, [selectedOptionId, shippingOptions, freeShipping, setValue, watch]);

  if (isDigital) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Free Shipping Checkbox - Always visible */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="freeShipping"
          checked={freeShipping}
          onCheckedChange={(checked: boolean) => {
            setValue("freeShipping", checked);
            if (checked) {
              setValue("shippingOptionId", null);
              setValue("shippingCost", 0); // Set shipping cost to 0 when free shipping is selected
            }
          }}
        />
        <Label htmlFor="freeShipping">Free Shipping</Label>
      </div>

      {/* Shipping Option Select - Visible when free shipping is not selected */}
      {!freeShipping && (
        <div className="space-y-4">
          <FormField
            control={control}
            name="shippingOptionId"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Shipping Option</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ? String(field.value) : undefined}
                >
                  <FormControl>
                    <SelectTrigger
                      className={
                        fieldState.error
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : ""
                      }
                    >
                      <SelectValue placeholder="Select a shipping option" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {shippingOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name} {option.isDefault ? "(Default)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {shippingOptions.length === 0 && (
            <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Truck className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                No shipping options yet
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Create your first shipping option to set up delivery rates for
                your products.
              </p>
              <Button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Shipping Option
              </Button>
            </div>
          )}
        </div>
      )}

      <ShippingOptionModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={fetchShippingOptions}
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
            {/* Handling Fee */}
            <FormField
              control={control}
              name="handlingFee"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-y-3 pb-6">
                  <FormLabel className="text-sm font-medium">
                    Handling Fee (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter handling fee"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Product Dimensions */}
            <div className="space-y-4 pb-6">
              <Label className="text-sm font-medium">Product Dimensions</Label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="itemWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Weight
                      </FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Enter weight"
                            {...field}
                            onChange={(e) => {
                              const value =
                                e.target.value === ""
                                  ? 0
                                  : parseFloat(e.target.value);
                              field.onChange(isNaN(value) ? 0 : value);
                            }}
                          />
                        </FormControl>
                        <Select
                          onValueChange={(value) =>
                            setValue("itemWeightUnit", value as WeightUnit)
                          }
                          defaultValue={watch("itemWeightUnit")}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {SUPPORTED_WEIGHT_UNITS.map((unit) => (
                              <SelectItem key={unit.code} value={unit.code}>
                                {unit.name} ({unit.symbol})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="itemLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Length
                      </FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Enter length"
                            {...field}
                            onChange={(e) => {
                              const value =
                                e.target.value === ""
                                  ? 0
                                  : parseFloat(e.target.value);
                              field.onChange(isNaN(value) ? 0 : value);
                            }}
                          />
                        </FormControl>
                        <Select
                          onValueChange={(value) =>
                            setValue(
                              "itemDimensionUnit",
                              value as DimensionUnit
                            )
                          }
                          defaultValue={watch("itemDimensionUnit")}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {SUPPORTED_DIMENSION_UNITS.map((unit) => (
                              <SelectItem key={unit.code} value={unit.code}>
                                {unit.name} ({unit.symbol})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="itemWidth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Width
                      </FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Enter width"
                            {...field}
                            onChange={(e) => {
                              const value =
                                e.target.value === ""
                                  ? 0
                                  : parseFloat(e.target.value);
                              field.onChange(isNaN(value) ? 0 : value);
                            }}
                          />
                        </FormControl>
                        <Select
                          onValueChange={(value) =>
                            setValue(
                              "itemDimensionUnit",
                              value as DimensionUnit
                            )
                          }
                          defaultValue={watch("itemDimensionUnit")}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {SUPPORTED_DIMENSION_UNITS.map((unit) => (
                              <SelectItem key={unit.code} value={unit.code}>
                                {unit.name} ({unit.symbol})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="itemHeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Height
                      </FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Enter height"
                            {...field}
                            onChange={(e) => {
                              const value =
                                e.target.value === ""
                                  ? 0
                                  : parseFloat(e.target.value);
                              field.onChange(isNaN(value) ? 0 : value);
                            }}
                          />
                        </FormControl>
                        <Select
                          onValueChange={(value) =>
                            setValue(
                              "itemDimensionUnit",
                              value as DimensionUnit
                            )
                          }
                          defaultValue={watch("itemDimensionUnit")}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {SUPPORTED_DIMENSION_UNITS.map((unit) => (
                              <SelectItem key={unit.code} value={unit.code}>
                                {unit.name} ({unit.symbol})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Shipping Notes */}
            <FormField
              control={control}
              name="shippingNotes"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-y-3 pb-6">
                  <FormLabel className="text-sm font-medium">
                    Shipping Notes (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any special shipping instructions or notes"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* GPSR Compliance Notice for EU Shipping */}
            {(() => {
              const hasEUShipping = shippingOptions.some((option) =>
                option.rates.some((rate) => rate.zone === "EUROPE")
              );

              if (hasEUShipping) {
                return (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg pb-2">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-blue-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-blue-800">
                          Selling to EU buyers?
                        </h4>
                        <p className="mt-1 text-sm text-blue-700">
                          You&apos;ll need to provide GPSR product safety
                          details before your products can go live in those
                          countries. You can still sell elsewhere without this
                          step.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

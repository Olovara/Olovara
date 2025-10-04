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
import { SUPPORTED_WEIGHT_UNITS, SUPPORTED_DIMENSION_UNITS, WeightUnit, DimensionUnit } from "@/data/units";
import { z } from "zod";
import { ProductSchema } from "@/schemas/ProductSchema";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Truck } from "lucide-react";
import ShippingOptionModal from "@/components/onboarding/ShippingOptionModal";

type ProductFormValues = z.infer<typeof ProductSchema>;

interface ShippingOption {
  id: string;
  name: string;
  isDefault: boolean;
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
}

export const ProductShippingSection = ({ form, freeShipping }: ProductShippingSectionProps) => {
  const { control, watch, setValue } = form;
  const isDigital = watch("isDigital");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const selectedOptionId = watch("shippingOptionId");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch shipping options when component mounts
  const fetchShippingOptions = async () => {
    try {
      const response = await fetch("/api/shipping-options");
      if (!response.ok) throw new Error("Failed to fetch shipping options");
      const data = await response.json();
      setShippingOptions(data);
    } catch (error) {
      console.error("Error fetching shipping options:", error);
    }
  };

  useEffect(() => {
    void fetchShippingOptions();
  }, []);

  // Set default shipping option if none is selected
  useEffect(() => {
    if (shippingOptions.length > 0 && !selectedOptionId) {
      const defaultOption = shippingOptions.find(option => option.isDefault);
      if (defaultOption) {
        setValue("shippingOptionId", defaultOption.id);
      }
    }
  }, [shippingOptions, selectedOptionId, setValue]);

  // Ensure shipping cost is 0 when free shipping is selected
  useEffect(() => {
    if (freeShipping) {
      setValue("shippingCost", 0);
    }
  }, [freeShipping, setValue]);

  if (isDigital) {
    return null;
  }

  return (
    <div className="space-y-6">
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

      {!freeShipping && (
        <div className="space-y-4">
          <FormField
            control={control}
            name="shippingOptionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shipping Option</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
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
                Create your first shipping option to set up delivery rates for your products.
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

      <FormField
        control={control}
        name="handlingFee"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Handling Fee (Optional)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter handling fee"
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value))}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Product Dimensions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="itemWeight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter weight"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        field.onChange(isNaN(value) ? 0 : value);
                      }}
                    />
                  </FormControl>
                  <Select
                    onValueChange={(value) => setValue("itemWeightUnit", value as WeightUnit)}
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
                <FormLabel>Length</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter length"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        field.onChange(isNaN(value) ? 0 : value);
                      }}
                    />
                  </FormControl>
                  <Select
                    onValueChange={(value) => setValue("itemDimensionUnit", value as DimensionUnit)}
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
                <FormLabel>Width</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter width"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        field.onChange(isNaN(value) ? 0 : value);
                      }}
                    />
                  </FormControl>
                  <Select
                    onValueChange={(value) => setValue("itemDimensionUnit", value as DimensionUnit)}
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
                <FormLabel>Height</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter height"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        field.onChange(isNaN(value) ? 0 : value);
                      }}
                    />
                  </FormControl>
                  <Select
                    onValueChange={(value) => setValue("itemDimensionUnit", value as DimensionUnit)}
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

      <FormField
        control={control}
        name="shippingNotes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Shipping Notes (Optional)</FormLabel>
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
        const hasEUShipping = shippingOptions.some(option => 
          option.rates.some(rate => rate.zone === "EUROPE")
        );
        
        if (hasEUShipping) {
          return (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-800">
                    Selling to EU buyers?
                  </h4>
                  <p className="mt-1 text-sm text-blue-700">
                    You&apos;ll need to provide GPSR product safety details before your products can go live in those countries. You can still sell elsewhere without this step.
                  </p>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
};

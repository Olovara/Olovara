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

type ProductFormValues = z.infer<typeof ProductSchema>;

interface ShippingProfile {
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
  const [shippingProfiles, setShippingProfiles] = useState<ShippingProfile[]>([]);
  const selectedProfileId = watch("shippingProfileId");

  // Fetch shipping profiles when component mounts
  useEffect(() => {
    const fetchShippingProfiles = async () => {
      try {
        const response = await fetch("/api/shipping-profiles");
        if (!response.ok) throw new Error("Failed to fetch shipping profiles");
        const data = await response.json();
        setShippingProfiles(data);
      } catch (error) {
        console.error("Error fetching shipping profiles:", error);
      }
    };

    void fetchShippingProfiles();
  }, []);

  // Set default shipping profile if none is selected
  useEffect(() => {
    if (shippingProfiles.length > 0 && !selectedProfileId) {
      const defaultProfile = shippingProfiles.find(profile => profile.isDefault);
      if (defaultProfile) {
        setValue("shippingProfileId", defaultProfile.id);
      }
    }
  }, [shippingProfiles, selectedProfileId, setValue]);

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
              setValue("shippingProfileId", null);
            }
          }}
        />
        <Label htmlFor="freeShipping">Free Shipping</Label>
      </div>

      {!freeShipping && (
        <FormField
          control={control}
          name="shippingProfileId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Shipping Profile</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a shipping profile" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {shippingProfiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name} {profile.isDefault ? "(Default)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

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
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
    </div>
  );
};

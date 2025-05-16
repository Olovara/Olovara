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

type ProductFormValues = z.infer<typeof ProductSchema>;

interface ProductShippingSectionProps {
  form: UseFormReturn<ProductFormValues>;
  freeShipping: boolean;
}

export const ProductShippingSection = ({ form, freeShipping }: ProductShippingSectionProps) => {
  const { control, watch, setValue } = form;
  const isDigital = watch("isDigital");

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
              setValue("shippingCost", 0);
            }
          }}
        />
        <Label htmlFor="freeShipping">Free Shipping</Label>
      </div>

      {!freeShipping && (
        <FormField
          control={control}
          name="shippingCost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Shipping Cost</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter shipping cost"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
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

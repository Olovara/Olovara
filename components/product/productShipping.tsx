"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField, FormItem, FormControl, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "../ui/checkbox";
import { Textarea } from "../ui/textarea";
import { useEffect } from "react";

type ShippingSectionProps = {
  form: any; // Fix: Accept form as prop
  freeShipping: boolean;
};

export function ProductShippingSection({
  form,
  freeShipping,
}: ShippingSectionProps) {
  // Watch for digital status and freeShipping
  const isDigital = useWatch({
    control: form.control,
    name: "isDigital",
  });
  const isFreeShippingChecked = useWatch({
    control: form.control,
    name: "freeShipping",
  });

  // Auto-reset shippingCost and handlingFee to 0 when freeShipping is selected
  useEffect(() => {
    if (isFreeShippingChecked) {
      form.setValue("shippingCost", 0, {
        shouldValidate: true,
        shouldDirty: false,
      });
      form.setValue("handlingFee", 0, {
        shouldValidate: true,
        shouldDirty: false,
      });
    }
  }, [isFreeShippingChecked, form]);

  return (
    <>
      {!isDigital && (
        <div className="space-y-6">
          {/* Free Shipping */}
          <FormField
            control={form.control}
            name="freeShipping"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="freeShipping"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label htmlFor="freeShipping">Free Shipping</Label>
                </div>
              </FormItem>
            )}
          />

          {/* Handling Fee */}
          <FormField
            control={form.control}
            name="handlingFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Handling Fee</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...field}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      field.onChange(value); // Store in dollars
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Shipping Cost */}
          <FormField
            control={form.control}
            name="shippingCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shipping Cost</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...field}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      field.onChange(value); // Store in dollars
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Item Weight */}
          <div className="flex flex-col gap-y-2">
            <Label>Item Weight (oz)</Label>
            <Input
              type="number"
              placeholder="Item weight"
              {...form.register("itemWeight", { valueAsNumber: true })}
            />
          </div>

          {/* Item Length */}
          <div className="flex flex-col gap-y-2">
            <Label>Item Length (in)</Label>
            <Input
              type="number"
              placeholder="Item length"
              {...form.register("itemLength", { valueAsNumber: true })}
            />
          </div>

          {/* Item Width */}
          <div className="flex flex-col gap-y-2">
            <Label>Item Width (in)</Label>
            <Input
              type="number"
              placeholder="Item width"
              {...form.register("itemWidth", { valueAsNumber: true })}
            />
          </div>

          {/* Item Height */}
          <div className="flex flex-col gap-y-2">
            <Label>Item Height (in)</Label>
            <Input
              type="number"
              placeholder="Item height"
              {...form.register("itemHeight", { valueAsNumber: true })}
            />
          </div>

          {/* Shipping Notes */}
          <div className="flex flex-col gap-y-2">
            <Label>Shipping Notes</Label>
            <Textarea
              placeholder="Please enter shipping notes here."
              {...form.register("shippingNotes")}
            />
          </div>
        </div>
      )}
    </>
  );
}

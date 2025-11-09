"use client";

import * as React from "react";
import { useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { useEffect } from "react";

type ProductInventorySectionProps = {
  form: any; // Accept form as a prop
};

export function ProductInventorySection({
  form,
}: ProductInventorySectionProps) {
  const isDigital = useWatch({
    control: form.control, // Watch the "isDigital" field
    name: "isDigital",
  });

  useEffect(() => {
    if (isDigital) {
      form.setValue("stock", null); // Use null
    }
  }, [isDigital, form]);

  return (
    <>
      {/* Show stock and processing details only for physical products */}
      {!isDigital && (
        <>
          {/* Stock */}
          <FormField
            control={form.control}
            name="stock"
            render={({ field, fieldState }) => (
              <FormItem className="flex flex-col gap-y-2">
                <Label>Stock</Label>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Stock quantity"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseInt(e.target.value, 10) : ""
                      )
                    }
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

          {/* In Stock Processing Time */}
          <FormField
            control={form.control}
            name="inStockProcessingTime"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-y-2">
                <Label>In Stock Processing Time (Days)</Label>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Processing time"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseInt(e.target.value, 10) : ""
                      )
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Out of Stock Lead Time */}
          <FormField
            control={form.control}
            name="outStockLeadTime"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-y-2">
                <Label>Out of Stock Lead Time (Days)</Label>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Lead time"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseInt(e.target.value, 10) : ""
                      )
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </>
      )}
    </>
  );
}

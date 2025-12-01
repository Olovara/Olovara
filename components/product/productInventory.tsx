"use client";

import * as React from "react";
import { useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { useEffect, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";

type ProductInventorySectionProps = {
  form: any;
  children?: React.ReactNode; // For ProductOptionsSection
  showAdvancedOptions?: boolean;
};

export function ProductInventorySection({
  form,
  children,
  showAdvancedOptions = true,
}: ProductInventorySectionProps) {
  const isDigital = useWatch({
    control: form.control, // Watch the "isDigital" field
    name: "isDigital",
  });
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  useEffect(() => {
    if (isDigital) {
      form.setValue("stock", null); // Use null
    }
  }, [isDigital, form]);

  return (
    <>
      {/* Show stock only for physical products */}
      {!isDigital && (
        <>
          {/* Stock - Always visible */}
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

          {/* Advanced Options - Collapsible Section */}
          {showAdvancedOptions ? (
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
                {/* In Stock Processing Time */}
                <FormField
                  control={form.control}
                  name="inStockProcessingTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-y-3 pb-6">
                      <Label className="text-sm font-medium">In Stock Processing Time (Days)</Label>
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
                    <FormItem className="flex flex-col gap-y-3 pb-6">
                      <Label className="text-sm font-medium">Out of Stock Lead Time (Days)</Label>
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

                {/* Product Options Section */}
                {children}
              </CollapsibleContent>
            </Collapsible>
          ) : (
            /* Product Options Section - Show directly when advanced options are hidden */
            children
          )}
        </>
      )}
    </>
  );
}

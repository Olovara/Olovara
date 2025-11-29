"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "../ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { Input } from "../ui/input";

// Accept form as a prop
type DropSectionProps = {
  form: any; // Pass form as a prop
};

export function ProductDropSection({ form }: DropSectionProps) {
  // Sync date with form when selected
  const handleDateChange = (selectedDate: Date | undefined) => {
    form.setValue("dropDate", selectedDate || null); // Update form value
  };

  // Sync time with form when selected
  const handleTimeChange = (time: string) => {
    form.setValue("dropTime", time); // Update form value
  };

  return (
    <div className="mt-6">
      {/* Check if it's a Product Drop */}
      <FormField
        control={form.control}
        name="productDrop"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(value) => field.onChange(value)}
                />
              </FormControl>
              <FormLabel className="!mt-0">Is this a product drop?</FormLabel>
            </div>
          </FormItem>
        )}
      />

      {/* Conditional Fields for Product Drop */}
      {form.watch("productDrop") && (
        <div className="flex flex-col gap-y-4 mt-4">
          <div className="flex flex-col gap-y-2">
            <Label>Product Drop Date</Label>
            <FormField
              control={form.control}
              name="dropDate"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[280px] justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        handleDateChange(date);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label>Product Drop Time</Label>
            <FormField
              control={form.control}
              name="dropTime"
              render={({ field }) => (
                <Input
                  type="time"
                  className="w-[280px]"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    handleTimeChange(e.target.value);
                  }}
                />
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}

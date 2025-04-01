"use client";

import { Textarea } from "@/components/ui/textarea";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";

type ProductHowItsMadeProps = {
  form: UseFormReturn<any>;
};

export function ProductHowItsMadeSection({ form }: ProductHowItsMadeProps) {
  return (
    <FormField
      control={form.control}
      name="howItsMade"
      render={({ field }) => (
        <FormItem>
          <FormLabel>How It&apos;s Made</FormLabel>
          <FormControl>
            <Textarea
              {...field}
              rows={5}
              placeholder="Describe how this product is made. Mention materials, techniques, and special care details."
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

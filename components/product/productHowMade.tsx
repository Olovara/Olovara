"use client";

import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

// Rich text editor (SSR disabled like other Quill usage)
const QuillEditor = dynamic(
  () => import("@/components/QuillEditor").then((mod) => mod.QuillEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[200px] animate-pulse rounded border bg-muted" />
    ),
  }
);

type ProductHowItsMadeProps = {
  form: UseFormReturn<any>;
};

export function ProductHowItsMadeSection({ form }: ProductHowItsMadeProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-4">
        <CollapsibleContent className="overflow-hidden">
          <FormField
            control={form.control}
            name="howItsMade"
            render={({ field }) => {
              // Character count: plain text length (strip HTML) like product description
              const html = typeof field.value === "string" ? field.value : "";
              const plainTextLength = html ? html.replace(/<[^>]*>/g, "").length : 0;
              const maxLength = 5000;
              const isNearLimit = plainTextLength > maxLength * 0.9;
              const isOverLimit = plainTextLength > maxLength;
              return (
                <FormItem>
                  <FormControl>
                    <div className="space-y-2">
                      <QuillEditor
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Describe how this product is made. Mention materials, techniques, and special care details."
                      />
                      <div className="flex justify-end">
                        <span
                          className={`text-xs ${
                            isOverLimit
                              ? "text-red-500 font-medium"
                              : isNearLimit
                                ? "text-amber-500"
                                : "text-muted-foreground"
                          }`}
                        >
                          {plainTextLength.toLocaleString()} / {maxLength.toLocaleString()} characters
                        </span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </CollapsibleContent>

        <CollapsibleTrigger className="w-full flex items-center justify-center py-2 hover:bg-gray-50 rounded-md transition-colors group">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 group-hover:text-gray-900">
              {isOpen ? "Hide" : "Show"} How It&apos;s Made
            </span>
            <ChevronDown
              className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </CollapsibleTrigger>
      </div>
    </Collapsible>
  );
}

"use client";

import { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { ProductDiscountSection } from "./productDiscount";
import { ProductDropSection } from "./productDrop";

type ProductPromotionsSectionProps = {
  form: UseFormReturn<any>;
};

export function ProductPromotionsSection({ form }: ProductPromotionsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-4">
        <CollapsibleContent className="overflow-hidden space-y-6">
          <ProductDiscountSection form={form} />
          <ProductDropSection form={form} />
        </CollapsibleContent>

        <CollapsibleTrigger className="w-full flex items-center justify-center py-2 hover:bg-gray-50 rounded-md transition-colors group">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 group-hover:text-gray-900">
              {isOpen ? "Hide" : "Show"} Promotions & Scheduling
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


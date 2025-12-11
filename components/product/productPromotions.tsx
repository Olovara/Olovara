"use client";

import { UseFormReturn } from "react-hook-form";
import { useState, useEffect } from "react";
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
  // Check if there's existing sale or drop data to determine initial open state
  const onSale = form.watch("onSale");
  const discount = form.watch("discount");
  const saleEndDate = form.watch("saleEndDate");
  const productDrop = form.watch("productDrop");
  const dropDate = form.watch("dropDate");
  
  // Open by default if there's existing sale or drop data
  const hasExistingData = onSale || (discount && discount > 0) || saleEndDate || productDrop || dropDate;
  const [isOpen, setIsOpen] = useState(hasExistingData);
  
  // Update open state when form values change (e.g., when initial data loads)
  useEffect(() => {
    const currentOnSale = form.getValues("onSale");
    const currentDiscount = form.getValues("discount");
    const currentSaleEndDate = form.getValues("saleEndDate");
    const currentProductDrop = form.getValues("productDrop");
    const currentDropDate = form.getValues("dropDate");
    
    const hasData = currentOnSale || (currentDiscount && currentDiscount > 0) || currentSaleEndDate || currentProductDrop || currentDropDate;
    if (hasData && !isOpen) {
      setIsOpen(true);
    }
  }, [form, isOpen]);

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


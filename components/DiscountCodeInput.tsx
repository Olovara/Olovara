"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Check, X, Tag } from "lucide-react";
import { SUPPORTED_CURRENCIES } from "@/data/units";

interface DiscountCodeInputProps {
  sellerId: string;
  productId: string;
  orderAmount: number;
  onDiscountApplied: (discountCode: string, discountAmount: number) => void;
  onDiscountRemoved: () => void;
  appliedDiscountCode?: string;
  appliedDiscountAmount?: number;
  currency?: string; // Add currency prop
}

export default function DiscountCodeInput({
  sellerId,
  productId,
  orderAmount,
  onDiscountApplied,
  onDiscountRemoved,
  appliedDiscountCode,
  appliedDiscountAmount,
  currency = "USD", // Default to USD
}: DiscountCodeInputProps) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Get currency info for display
  const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === currency) || SUPPORTED_CURRENCIES[0];

  const handleApplyDiscount = async () => {
    if (!code.trim()) {
      toast.error("Please enter a discount code");
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetch("/api/discount/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          sellerId,
          productId,
          orderAmount,
        }),
      });

      const data = await response.json();

      if (response.ok && data.isValid) {
        onDiscountApplied(data.discountCode.code, data.discountCode.discountAmount);
        setCode("");
        toast.success(`Discount applied: ${data.discountCode.name}`);
      } else {
        toast.error(data.error || "Invalid discount code");
      }
    } catch (error) {
      console.error("Error applying discount:", error);
      toast.error("Error applying discount code");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveDiscount = () => {
    onDiscountRemoved();
    toast.success("Discount removed");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleApplyDiscount();
    }
  };

  // Format discount amount in the correct currency
  const formatDiscountAmount = (amount: number) => {
    const amountInCurrency = amount / Math.pow(10, currencyInfo.decimals);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currencyInfo.decimals,
      maximumFractionDigits: currencyInfo.decimals,
    }).format(amountInCurrency);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Tag className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Discount Code</span>
      </div>

      {appliedDiscountCode ? (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">
                {appliedDiscountCode}
              </p>
              <p className="text-xs text-green-600">
                -{formatDiscountAmount(appliedDiscountAmount || 0)} applied
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveDiscount}
            className="text-green-600 hover:text-green-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Enter discount code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
            disabled={isValidating}
          />
          <Button
            onClick={handleApplyDiscount}
            disabled={isValidating || !code.trim()}
            size="sm"
            variant="outline"
          >
            {isValidating ? "Applying..." : "Apply"}
          </Button>
        </div>
      )}
    </div>
  );
} 
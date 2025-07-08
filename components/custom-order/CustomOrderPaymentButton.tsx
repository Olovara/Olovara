"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/useCurrency";
import { Loader2, CreditCard } from "lucide-react";

interface CustomOrderPaymentButtonProps {
  submissionId: string;
  paymentType: "MATERIALS_DEPOSIT" | "FINAL_PAYMENT";
  amount: number; // Amount in cents
  currency: string;
  disabled?: boolean;
  className?: string;
}

export default function CustomOrderPaymentButton({
  submissionId,
  paymentType,
  amount,
  currency,
  disabled = false,
  className = "",
}: CustomOrderPaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const { currency: preferredCurrency } = useCurrency();

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/stripe/custom-order-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId,
          paymentType,
          preferredCurrency,
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        console.error("Payment initialization failed:", data.error);
        toast.error(data.error || "Failed to initialize payment.");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amountInCents: number, currencyCode: string) => {
    const amount = amountInCents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  };

  const getButtonText = () => {
    if (loading) return "Processing...";
    
    if (paymentType === "MATERIALS_DEPOSIT") {
      return `Pay Materials Deposit (${formatAmount(amount, currency)})`;
    } else {
      return `Pay Final Payment (${formatAmount(amount, currency)})`;
    }
  };

  const getDescription = () => {
    if (paymentType === "MATERIALS_DEPOSIT") {
      return "This covers the cost of materials and secures your order. This payment is non-refundable.";
    } else {
      return "This covers the remaining balance and shipping costs.";
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="text-sm text-muted-foreground">
        {getDescription()}
      </div>
      
      <Button
        onClick={handlePayment}
        disabled={disabled || loading}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="mr-2 h-4 w-4" />
        )}
        {getButtonText()}
      </Button>
    </div>
  );
} 
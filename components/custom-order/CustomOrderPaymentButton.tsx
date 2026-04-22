"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomOrderPaymentButtonProps {
  submissionId: string;
  paymentType: "QUOTE_DEPOSIT" | "MATERIALS_DEPOSIT" | "FINAL_PAYMENT";
  amount: number; // Amount in cents (display only; server recalculates at payment)
  currency: string;
  disabled?: boolean;
  className?: string;
  /** e.g. close a parent dialog before navigating to `/checkout/custom-order/...` */
  onBeforeNavigate?: () => void;
}

/** Navigates to the marketplace checkout-style page, then Stripe — same pattern as product checkout. */
export default function CustomOrderPaymentButton({
  submissionId,
  paymentType,
  amount,
  currency,
  disabled = false,
  className = "",
  onBeforeNavigate,
}: CustomOrderPaymentButtonProps) {
  const formatAmount = (amountInCents: number, currencyCode: string) => {
    const n = amountInCents / 100;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(n);
  };

  const href = `/checkout/custom-order/${encodeURIComponent(submissionId)}?paymentType=${encodeURIComponent(paymentType)}`;

  const buttonLabel = `Continue to checkout (${formatAmount(amount, currency)})`;

  const getDescription = () => {
    if (paymentType === "QUOTE_DEPOSIT") {
      return "Review your order on the checkout page, then pay the deposit securely with Stripe—same flow as other purchases.";
    }
    if (paymentType === "MATERIALS_DEPOSIT") {
      return "Review on the checkout page, then complete payment securely with Stripe.";
    }
    return "Review on the checkout page, then pay the remaining balance securely with Stripe.";
  };

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm text-muted-foreground">{getDescription()}</p>

      {disabled ? (
        <Button disabled className="w-full" size="lg" type="button">
          <CreditCard className="mr-2 h-4 w-4" />
          {buttonLabel}
        </Button>
      ) : (
        <Button className="w-full" size="lg" asChild>
          <Link
            href={href}
            onClick={() => {
              onBeforeNavigate?.();
            }}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {buttonLabel}
          </Link>
        </Button>
      )}
    </div>
  );
}

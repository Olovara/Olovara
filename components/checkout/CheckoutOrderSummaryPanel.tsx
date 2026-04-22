import type { ReactNode } from "react";

type CheckoutOrderSummaryPanelProps = {
  title?: string;
  children: ReactNode;
  totalLabel?: string;
  totalAmountDisplay: string;
  totalHint?: ReactNode;
  footerNotes?: ReactNode;
};

/**
 * Sticky sidebar summary card — shared by product checkout and custom-order checkout.
 */
export default function CheckoutOrderSummaryPanel({
  title = "Order summary",
  children,
  totalLabel = "Total",
  totalAmountDisplay,
  totalHint,
  footerNotes,
}: CheckoutOrderSummaryPanelProps) {
  return (
    <div className="sticky top-8 rounded-lg border border-brand-dark-neutral-200 bg-brand-light-neutral-50 shadow-sm">
      <div className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-brand-dark-neutral-900">
          {title}
        </h2>
        {children}
        <div className="border-t border-brand-dark-neutral-200 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-brand-dark-neutral-900">
              {totalLabel}
            </p>
            <p className="text-lg font-semibold text-brand-dark-neutral-900">
              {totalAmountDisplay}
            </p>
          </div>
          {totalHint && (
            <p className="mt-1 text-xs text-brand-dark-neutral-600">{totalHint}</p>
          )}
        </div>
        {footerNotes && (
          <div className="mt-6 space-y-3 text-xs text-brand-dark-neutral-600">
            {footerNotes}
          </div>
        )}
      </div>
    </div>
  );
}

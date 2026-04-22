"use client";

import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

type CheckoutPageHeaderProps = {
  backLabel: string;
  /** Use with `href` for navigation (e.g. custom orders dashboard). */
  backHref?: string;
  /** Use instead of `href` for browser back (e.g. product page). */
  onBack?: () => void;
};

/**
 * Shared top bar for marketplace checkout flows (product purchase, custom order payment).
 */
export default function CheckoutPageHeader({
  backLabel,
  backHref,
  onBack,
}: CheckoutPageHeaderProps) {
  return (
    <div className="border-b border-brand-dark-neutral-200 bg-brand-light-neutral-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center text-brand-dark-neutral-600 transition-colors hover:text-brand-primary-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {backLabel}
              </button>
            ) : (
              <Link
                href={backHref || "/"}
                className="flex items-center text-brand-dark-neutral-600 transition-colors hover:text-brand-primary-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {backLabel}
              </Link>
            )}
          </div>
          <div className="flex items-center space-x-2 text-sm text-brand-dark-neutral-600">
            <Lock className="h-4 w-4" />
            <span>Secure checkout</span>
          </div>
        </div>
      </div>
    </div>
  );
}

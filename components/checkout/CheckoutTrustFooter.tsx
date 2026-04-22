import { Shield, Lock } from "lucide-react";

type CheckoutTrustFooterProps = {
  /** e.g. "Secure payment processing powered by Stripe" */
  caption?: string;
};

/**
 * Trust row used under the primary CTA on checkout pages.
 */
export default function CheckoutTrustFooter({
  caption = "Secure payment processing powered by Stripe",
}: CheckoutTrustFooterProps) {
  return (
    <div className="mt-4 text-center">
      <p className="text-xs text-brand-dark-neutral-600">{caption}</p>
      <div className="mt-2 flex items-center justify-center space-x-4">
        <div className="flex items-center text-xs text-brand-dark-neutral-600">
          <Shield className="mr-1 h-3 w-3" />
          <span>SSL secured</span>
        </div>
        <div className="flex items-center text-xs text-brand-dark-neutral-600">
          <Lock className="mr-1 h-3 w-3" />
          <span>256-bit encryption</span>
        </div>
      </div>
    </div>
  );
}

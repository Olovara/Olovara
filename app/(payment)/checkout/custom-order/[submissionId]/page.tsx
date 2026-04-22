"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/useCurrency";
import { useLocation } from "@/hooks/useLocation";
import { SUPPORTED_COUNTRIES, type Country } from "@/data/countries";
import { ReCaptcha } from "@/components/ui/recaptcha";
import EmbeddedPaymentForm from "@/components/EmbeddedPaymentForm";
import CheckoutPageHeader from "@/components/checkout/CheckoutPageHeader";
import CheckoutTrustFooter from "@/components/checkout/CheckoutTrustFooter";
import CheckoutOrderSummaryPanel from "@/components/checkout/CheckoutOrderSummaryPanel";
import { CreditCard, CheckCircle, Loader2, FileText, Shield } from "lucide-react";
import {
  getBuyerCustomOrderSubmissionDetail,
  type BuyerCustomOrderSubmissionDetail,
} from "@/actions/customOrderFormActions";

type Address = {
  name: string;
  street: string;
  city: string;
  state: string;
  postal: string;
  country: string;
};

function formatMinor(amountInCents: number, currencyCode: string) {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

function paymentLineLabel(paymentType: string): string {
  if (paymentType === "FINAL_PAYMENT") return "Final payment";
  if (paymentType === "QUOTE_DEPOSIT" || paymentType === "MATERIALS_DEPOSIT") {
    return "Deposit";
  }
  return "Payment";
}

/** Mirrors server rules in custom-order-create-payment-intent (blocks Continue when set). */
function checkoutEligibilityError(
  detail: BuyerCustomOrderSubmissionDetail,
  paymentType: string,
): string | null {
  if (
    paymentType !== "QUOTE_DEPOSIT" &&
    paymentType !== "MATERIALS_DEPOSIT" &&
    paymentType !== "FINAL_PAYMENT"
  ) {
    return "Invalid payment type.";
  }
  if (paymentType === "QUOTE_DEPOSIT" || paymentType === "MATERIALS_DEPOSIT") {
    if (detail.quoteDepositPaid) return "Deposit already paid";
    if (detail.quoteDepositMinor == null) {
      return "Deposit amount not set by seller";
    }
    return null;
  }
  if (!detail.quoteDepositPaid) return "Deposit must be paid first";
  if (detail.finalPaymentPaid) return "Final payment already paid";
  if (detail.finalPaymentAmount == null) {
    return "Final payment amount not set";
  }
  return null;
}

function expectedAmountMinor(
  detail: BuyerCustomOrderSubmissionDetail,
  paymentType: string,
): number {
  if (paymentType === "FINAL_PAYMENT") return detail.finalPaymentAmount ?? 0;
  return detail.quoteDepositMinor ?? 0;
}

function CustomOrderCheckoutInner() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const submissionId = params.submissionId as string;
  const paymentType = searchParams.get("paymentType") ?? "";
  const { currency: preferredCurrency } = useCurrency();
  const { locationPreferences } = useLocation();

  const userCountry = locationPreferences?.countryCode || "US";

  const [detail, setDetail] = useState<BuyerCustomOrderSubmissionDetail | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [paymentAmountMinor, setPaymentAmountMinor] = useState(0);
  const [paymentCurrency, setPaymentCurrency] = useState("usd");

  const [loadingPi, setLoadingPi] = useState(false);
  const [shouldTriggerRecaptcha, setShouldTriggerRecaptcha] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);

  const [shippingAddress, setShippingAddress] = useState<Address>({
    name: "",
    street: "",
    city: "",
    state: "",
    postal: "",
    country: userCountry,
  });
  const [billingAddress, setBillingAddress] = useState<Address>({
    name: "",
    street: "",
    city: "",
    state: "",
    postal: "",
    country: userCountry,
  });
  const [sameAsShipping, setSameAsShipping] = useState(true);

  const idempotencyKeyRef = useRef(crypto.randomUUID());

  useEffect(() => {
    if (locationPreferences?.countryCode) {
      const code = locationPreferences.countryCode;
      if (SUPPORTED_COUNTRIES.some((c) => c.code === code)) {
        setShippingAddress((p) => ({ ...p, country: code }));
        setBillingAddress((p) => ({ ...p, country: code }));
      }
    }
  }, [locationPreferences?.countryCode]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingDetail(true);
      setLoadError(null);
      setDetail(null);

      if (
        paymentType !== "QUOTE_DEPOSIT" &&
        paymentType !== "MATERIALS_DEPOSIT" &&
        paymentType !== "FINAL_PAYMENT"
      ) {
        setLoadError(
          "Invalid payment type. Open this page from your custom orders.",
        );
        setLoadingDetail(false);
        return;
      }

      try {
        const res = await getBuyerCustomOrderSubmissionDetail(submissionId);

        if (cancelled) return;

        if (res.error === "Not authenticated") {
          router.push(
            `/login?callbackUrl=${encodeURIComponent(
              `/checkout/custom-order/${submissionId}?paymentType=${paymentType}`,
            )}`,
          );
          return;
        }

        if (res.error || !res.data) {
          setLoadError(res.error ?? "Could not load checkout.");
          return;
        }

        setDetail(res.data);
      } catch {
        if (!cancelled) {
          setLoadError("Could not load checkout. Try again.");
        }
      } finally {
        if (!cancelled) {
          setLoadingDetail(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [submissionId, paymentType, router]);

  const isFinalPayment = paymentType === "FINAL_PAYMENT";

  const eligibilityError = useMemo(
    () =>
      detail ? checkoutEligibilityError(detail, paymentType) : null,
    [detail, paymentType],
  );

  const validateAddresses = () => {
    const ship = shippingAddress;
    for (const field of [
      "name",
      "street",
      "city",
      "state",
      "postal",
      "country",
    ] as const) {
      if (!ship[field]?.trim()) {
        toast.error("Please complete your shipping address.");
        return false;
      }
    }
    if (!sameAsShipping) {
      const bill = billingAddress;
      for (const field of [
        "name",
        "street",
        "city",
        "state",
        "postal",
        "country",
      ] as const) {
        if (!bill[field]?.trim()) {
          toast.error("Please complete your billing address.");
          return false;
        }
      }
    }
    return true;
  };

  const handleContinueToPayment = () => {
    if (!detail || eligibilityError) return;
    if (isFinalPayment && !validateAddresses()) return;

    if (process.env.NODE_ENV === "development") {
      void handleRecaptchaSuccess("dev-token");
      return;
    }
    setShouldTriggerRecaptcha(true);
    setRecaptchaError(null);
  };

  const handleRecaptchaSuccess = useCallback(
    async (token: string) => {
      setShouldTriggerRecaptcha(false);
      setLoadingPi(true);
      try {
        const body: Record<string, unknown> = {
          submissionId,
          paymentType,
          preferredCurrency,
          recaptchaToken:
            process.env.NODE_ENV === "development" ? "dev-token" : token,
        };

        if (isFinalPayment) {
          body.shippingAddress = shippingAddress;
          body.sameAsShipping = sameAsShipping;
          body.billingAddress = sameAsShipping ? shippingAddress : billingAddress;
        }

        const response = await fetch("/api/stripe/custom-order-create-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKeyRef.current,
          },
          body: JSON.stringify(body),
        });

        const data = await response.json();

        if (response.ok && data.clientSecret) {
          setClientSecret(data.clientSecret);
          setCustomerId(data.customerId ?? null);
          setPaymentAmountMinor(data.amount);
          setPaymentCurrency(data.currency || "usd");
          setShowPaymentForm(true);
          setTimeout(() => {
            document.getElementById("custom-order-payment-form")?.scrollIntoView({
              behavior: "smooth",
            });
          }, 100);
        } else {
          toast.error(data.error || "Could not start payment.");
        }
      } catch {
        toast.error("An unexpected error occurred.");
      } finally {
        setLoadingPi(false);
      }
    },
    [
      submissionId,
      paymentType,
      preferredCurrency,
      isFinalPayment,
      shippingAddress,
      billingAddress,
      sameAsShipping,
    ],
  );

  const handleRecaptchaError = (msg: string) => {
    setRecaptchaError(msg);
    setShouldTriggerRecaptcha(false);
    toast.error("Security verification failed. Please try again.");
  };

  const handlePaymentSuccess = (_paymentIntentId: string) => {
    const paid = isFinalPayment ? "final" : "deposit";
    router.push(
      `/member/dashboard/custom-orders?submissionId=${encodeURIComponent(submissionId)}&paid=${paid}`,
    );
  };

  const handlePaymentError = (msg: string) => {
    toast.error(msg);
  };

  if (loadingDetail) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-brand-light-neutral-50">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-brand-primary-700" />
          <p className="text-brand-dark-neutral-600">Loading checkout…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-brand-light-neutral-50 px-4">
        <p className="mb-4 text-center text-brand-dark-neutral-800">{loadError}</p>
        <Button variant="outlinePrimary" asChild>
          <Link href="/member/dashboard/custom-orders">Back to custom orders</Link>
        </Button>
      </div>
    );
  }

  if (!detail) {
    return null;
  }

  const blocked = Boolean(eligibilityError);
  const displayAmountMinor = showPaymentForm
    ? paymentAmountMinor
    : expectedAmountMinor(detail, paymentType);
  const displayCurrency = showPaymentForm
    ? paymentCurrency.toUpperCase()
    : detail.currency;
  const amountLabel = formatMinor(displayAmountMinor, displayCurrency);

  // Same return URL as product checkout (EmbeddedPaymentForm default) so 3DS / redirect flows behave consistently.
  const paymentReturnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/checkout/success`
      : undefined;

  return (
    <div className="min-h-screen w-full bg-brand-light-neutral-50">
      <CheckoutPageHeader
        backHref="/member/dashboard/custom-orders"
        backLabel="Back to custom orders"
      />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-brand-dark-neutral-200 bg-brand-light-neutral-50 shadow-sm">
              <div className="border-b border-brand-dark-neutral-200 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:space-x-4">
                  <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg border border-brand-dark-neutral-200 bg-brand-light-neutral-100">
                    <FileText className="h-9 w-9 text-brand-dark-neutral-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl font-semibold text-brand-dark-neutral-900">
                      {detail.formTitle || "Custom order"}
                    </h1>
                    <p className="text-sm text-brand-dark-neutral-600">
                      Sold by {detail.shopName}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-brand-dark-neutral-500">
                      <div className="flex items-center">
                        <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                        <span>Custom order request</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right sm:pt-0">
                    <p className="text-lg font-semibold text-brand-dark-neutral-900">
                      {amountLabel}
                    </p>
                    <p className="text-xs text-brand-dark-neutral-500">
                      {isFinalPayment ? "Balance due" : "Due now"}
                    </p>
                  </div>
                </div>
              </div>

              {isFinalPayment && !showPaymentForm && (
                <div className="border-b border-brand-dark-neutral-200 p-6">
                  <h2 className="mb-4 text-lg font-semibold text-brand-dark-neutral-900">
                    Shipping address
                  </h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <Label>Full name</Label>
                      <Input
                        className="mt-1"
                        value={shippingAddress.name}
                        onChange={(e) =>
                          setShippingAddress((p) => ({ ...p, name: e.target.value }))
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Street</Label>
                      <Input
                        className="mt-1"
                        value={shippingAddress.street}
                        onChange={(e) =>
                          setShippingAddress((p) => ({
                            ...p,
                            street: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>City</Label>
                      <Input
                        className="mt-1"
                        value={shippingAddress.city}
                        onChange={(e) =>
                          setShippingAddress((p) => ({ ...p, city: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label>State / Province</Label>
                      <Input
                        className="mt-1"
                        value={shippingAddress.state}
                        onChange={(e) =>
                          setShippingAddress((p) => ({ ...p, state: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Postal code</Label>
                      <Input
                        className="mt-1"
                        value={shippingAddress.postal}
                        onChange={(e) =>
                          setShippingAddress((p) => ({
                            ...p,
                            postal: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Country</Label>
                      <Select
                        value={shippingAddress.country}
                        onValueChange={(v) =>
                          setShippingAddress((p) => ({ ...p, country: v }))
                        }
                      >
                        <SelectTrigger className="mt-1 w-full">
                          <SelectValue placeholder="Country" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_COUNTRIES.map((c: Country) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center space-x-2">
                    <Checkbox
                      id="same-as-ship"
                      checked={sameAsShipping}
                      onCheckedChange={(c) => setSameAsShipping(c === true)}
                    />
                    <Label htmlFor="same-as-ship" className="font-normal">
                      Billing address same as shipping
                    </Label>
                  </div>

                  {!sameAsShipping && (
                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <Label>Billing full name</Label>
                        <Input
                          className="mt-1"
                          value={billingAddress.name}
                          onChange={(e) =>
                            setBillingAddress((p) => ({ ...p, name: e.target.value }))
                          }
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Billing street</Label>
                        <Input
                          className="mt-1"
                          value={billingAddress.street}
                          onChange={(e) =>
                            setBillingAddress((p) => ({
                              ...p,
                              street: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label>City</Label>
                        <Input
                          className="mt-1"
                          value={billingAddress.city}
                          onChange={(e) =>
                            setBillingAddress((p) => ({ ...p, city: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <Label>State</Label>
                        <Input
                          className="mt-1"
                          value={billingAddress.state}
                          onChange={(e) =>
                            setBillingAddress((p) => ({ ...p, state: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <Label>Postal</Label>
                        <Input
                          className="mt-1"
                          value={billingAddress.postal}
                          onChange={(e) =>
                            setBillingAddress((p) => ({
                              ...p,
                              postal: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label>Country</Label>
                        <Select
                          value={billingAddress.country}
                          onValueChange={(v) =>
                            setBillingAddress((p) => ({ ...p, country: v }))
                          }
                        >
                          <SelectTrigger className="mt-1 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SUPPORTED_COUNTRIES.map((c: Country) => (
                              <SelectItem key={c.code} value={c.code}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2 border-b border-brand-dark-neutral-200 p-6">
                <h2 className="text-lg font-semibold text-brand-dark-neutral-900">
                  {showPaymentForm ? "Pay securely" : "Next step"}
                </h2>
                <p className="text-sm text-brand-dark-neutral-600">
                  {showPaymentForm
                    ? "Enter your card details below."
                    : isFinalPayment
                      ? "Confirm your shipping details, then continue to the card form."
                      : "Continue to the secure card form to pay your deposit."}
                </p>
                {blocked && eligibilityError && (
                  <p className="text-sm text-destructive">{eligibilityError}</p>
                )}
                {recaptchaError && (
                  <p className="text-sm text-destructive">{recaptchaError}</p>
                )}
              </div>

              <div className="hidden">
                <ReCaptcha
                  action="checkout"
                  onVerify={handleRecaptchaSuccess}
                  onError={handleRecaptchaError}
                  trigger={shouldTriggerRecaptcha}
                />
              </div>

              {!showPaymentForm ? (
                <div className="p-6">
                  <Button
                    type="button"
                    onClick={handleContinueToPayment}
                    disabled={blocked || loadingPi || shouldTriggerRecaptcha}
                    className="h-12 w-full bg-brand-primary-700 text-lg font-semibold text-brand-light-neutral-50 hover:bg-brand-primary-600"
                  >
                    {loadingPi || shouldTriggerRecaptcha ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {shouldTriggerRecaptcha
                          ? "Verifying security…"
                          : "Preparing payment…"}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <CreditCard className="mr-2 h-5 w-5" />
                        Continue to payment
                      </span>
                    )}
                  </Button>
                  <CheckoutTrustFooter />
                </div>
              ) : (
                <div id="custom-order-payment-form" className="p-6">
                  <EmbeddedPaymentForm
                    clientSecret={clientSecret!}
                    customerId={customerId || undefined}
                    amount={paymentAmountMinor}
                    currency={paymentCurrency}
                    paymentReturnUrl={paymentReturnUrl}
                    showAddressElements={false}
                    shippingAddress={
                      isFinalPayment ? shippingAddress : undefined
                    }
                    billingAddress={
                      isFinalPayment
                        ? sameAsShipping
                          ? shippingAddress
                          : billingAddress
                        : undefined
                    }
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <CheckoutOrderSummaryPanel
              totalLabel="Total due"
              totalAmountDisplay={amountLabel}
              totalHint={
                <>
                  {displayCurrency} ·{" "}
                  {showPaymentForm
                    ? "Amount charged in this session"
                    : "Estimated from seller’s quote"}
                </>
              }
              footerNotes={
                <div className="flex items-start space-x-2">
                  <Shield className="mt-0.5 h-3 w-3 flex-shrink-0" />
                  <span>Your payment information is secure and encrypted</span>
                </div>
              }
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1 pr-2">
                  <p className="text-sm font-medium text-brand-dark-neutral-900">
                    {paymentLineLabel(paymentType)}
                  </p>
                  <p className="text-sm text-brand-dark-neutral-600">
                    {detail.formTitle || "Custom order"}
                  </p>
                </div>
                <p className="text-sm font-medium text-brand-dark-neutral-900">
                  {amountLabel}
                </p>
              </div>

              <div className="mb-4 flex justify-between text-sm text-brand-dark-neutral-600">
                <span>Tax</span>
                <span>Included where applicable</span>
              </div>

              {isFinalPayment && (
                <div className="mb-4 flex justify-between text-sm text-brand-dark-neutral-600">
                  <span>Shipping</span>
                  <span>Separate from product orders</span>
                </div>
              )}
            </CheckoutOrderSummaryPanel>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomOrderCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-brand-light-neutral-50">
          <Loader2 className="h-12 w-12 animate-spin text-brand-primary-700" />
        </div>
      }
    >
      <CustomOrderCheckoutInner />
    </Suspense>
  );
}

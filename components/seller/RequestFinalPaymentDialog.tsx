"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Truck } from "lucide-react";
import {
  requestFinalPayment,
  getSubmissionPaymentDetails,
} from "@/actions/customOrderPaymentActions";
import { isZeroDecimalCurrency, minorToMajorAmount } from "@/data/units";
import ShippingOptionModal from "@/components/onboarding/ShippingOptionModal";

type ShippingOptionRow = {
  id: string;
  name: string;
  isDefault: boolean;
};

export default function RequestFinalPaymentDialog({
  open,
  onOpenChange,
  submissionId,
  currency,
  onRequested,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissionId: string | null;
  currency: string;
  onRequested?: () => void;
}) {
  const [loadingPrefill, setLoadingPrefill] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finalMajor, setFinalMajor] = useState("");
  const [notes, setNotes] = useState("");
  const [resolvedCurrency, setResolvedCurrency] = useState(currency);
  const [shippingIncludedInPrice, setShippingIncludedInPrice] = useState(false);
  const [shippingOptionId, setShippingOptionId] = useState<string>("");
  const [shippingOptions, setShippingOptions] = useState<ShippingOptionRow[]>(
    [],
  );
  const [shippingModalOpen, setShippingModalOpen] = useState(false);

  const code = resolvedCurrency?.trim() || "USD";
  const step = isZeroDecimalCurrency(code) ? "1" : "0.01";

  const fetchShippingOptions = useCallback(async (preferredId?: string) => {
    try {
      const res = await fetch("/api/shipping-options");
      if (!res.ok) throw new Error("Failed to load shipping profiles");
      const data = (await res.json()) as ShippingOptionRow[];
      setShippingOptions(Array.isArray(data) ? data : []);
      if (preferredId && data.some((o) => o.id === preferredId)) {
        setShippingOptionId(preferredId);
      }
    } catch (e) {
      console.error(e);
      toast.error("Could not load shipping profiles");
    }
  }, []);

  const resetEmpty = useCallback(() => {
    setFinalMajor("");
    setNotes("");
    setShippingIncludedInPrice(false);
    setShippingOptionId("");
  }, []);

  const loadPrefill = useCallback(
    async (id: string) => {
      setLoadingPrefill(true);
      try {
        const res = await getSubmissionPaymentDetails(id);
        if (res.error || !res.data) return;
        const cur = (res.data.currency || "USD").trim();
        setResolvedCurrency(cur);
        if (res.data.finalPaymentAmount != null) {
          setFinalMajor(
            String(minorToMajorAmount(res.data.finalPaymentAmount, cur)),
          );
        } else {
          setFinalMajor("");
        }
        const inc = Boolean(res.data.finalShippingIncludedInPrice);
        setShippingIncludedInPrice(inc);
        const optId = res.data.finalShippingOptionId?.trim() ?? "";
        setShippingOptionId(inc ? "" : optId);
        await fetchShippingOptions(!inc ? optId : undefined);
      } finally {
        setLoadingPrefill(false);
      }
    },
    [fetchShippingOptions],
  );

  useEffect(() => {
    setResolvedCurrency(currency?.trim() || "USD");
  }, [currency, open]);

  useEffect(() => {
    if (!open || !submissionId) {
      resetEmpty();
      return;
    }
    void loadPrefill(submissionId);
  }, [open, submissionId, loadPrefill, resetEmpty]);

  useEffect(() => {
    if (shippingIncludedInPrice) {
      setShippingOptionId("");
    }
  }, [shippingIncludedInPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionId) return;

    const amt = Number(finalMajor);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Enter a valid final payment amount");
      return;
    }

    if (!shippingIncludedInPrice && !shippingOptionId.trim()) {
      toast.error(
        "Select a shipping profile, or check that shipping is included in the price",
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await requestFinalPayment({
        submissionId,
        finalPaymentAmount: amt,
        notes: notes.trim() || undefined,
        finalShippingIncludedInPrice: shippingIncludedInPrice,
        finalShippingOptionId: shippingIncludedInPrice
          ? null
          : shippingOptionId.trim(),
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? "Final payment requested");
      onRequested?.();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="border-brand-dark-neutral-200 bg-brand-light-neutral-50">
          <DialogHeader>
            <DialogTitle>Request final payment</DialogTitle>
            <DialogDescription>
              Set the remaining balance and notify the buyer to pay. Choose how
              shipping is handled for this order.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="finalPaymentAmount">Final payment amount</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="finalPaymentAmount"
                  type="number"
                  min={step}
                  step={step}
                  inputMode="decimal"
                  value={finalMajor}
                  onChange={(e) => setFinalMajor(e.target.value)}
                  placeholder={`0${step === "0.01" ? ".00" : ""}`}
                  disabled={loadingPrefill || submitting}
                />
                <span className="text-sm text-muted-foreground">{code}</span>
              </div>
              {loadingPrefill && (
                <p className="text-xs text-muted-foreground">Loading…</p>
              )}
            </div>

            <div className="rounded-lg border border-brand-dark-neutral-200 bg-background/80 p-4 space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="shippingIncluded"
                  checked={shippingIncludedInPrice}
                  onCheckedChange={(v) =>
                    setShippingIncludedInPrice(Boolean(v))
                  }
                  disabled={submitting}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="shippingIncluded"
                    className="font-medium cursor-pointer leading-none"
                  >
                    Shipping is already included in this price
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Check this if the amount above already covers delivery. No
                    extra shipping will be charged at checkout.
                  </p>
                </div>
              </div>

              {!shippingIncludedInPrice && (
                <div className="space-y-2">
                  <Label>Shipping profile</Label>
                  <p className="text-xs text-muted-foreground">
                    Shipping cost is calculated from this profile when the buyer
                    enters their address (same as your product listings).
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Select
                      value={shippingOptionId || undefined}
                      onValueChange={setShippingOptionId}
                      disabled={submitting || shippingOptions.length === 0}
                    >
                      <SelectTrigger className="w-full sm:flex-1">
                        <SelectValue placeholder="Select a shipping profile" />
                      </SelectTrigger>
                      <SelectContent>
                        {shippingOptions.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.name}
                            {opt.isDefault ? " (Default)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => setShippingModalOpen(true)}
                      disabled={submitting}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      New profile
                    </Button>
                  </div>
                  {shippingOptions.length === 0 && (
                    <div className="flex items-start gap-2 rounded-md border border-dashed border-muted-foreground/40 p-3 text-sm text-muted-foreground">
                      <Truck className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        You don&apos;t have any shipping profiles yet. Create
                        one to charge shipping on the final payment, or check
                        &quot;included in price&quot; above.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes to buyer (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                disabled={submitting}
                placeholder="What are you delivering at this stage?"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outlinePrimary"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Requesting…
                  </>
                ) : (
                  "Request final payment"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ShippingOptionModal
        isOpen={shippingModalOpen}
        onOpenChange={setShippingModalOpen}
        onSuccess={(newId) => {
          void fetchShippingOptions(newId);
          if (newId) setShippingOptionId(newId);
        }}
      />
    </>
  );
}

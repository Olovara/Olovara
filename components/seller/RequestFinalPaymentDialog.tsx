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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { requestFinalPayment } from "@/actions/customOrderPaymentActions";
import { isZeroDecimalCurrency, minorToMajorAmount } from "@/data/units";
import { getSubmissionPaymentDetails } from "@/actions/customOrderPaymentActions";

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

  const code = resolvedCurrency?.trim() || "USD";
  const step = isZeroDecimalCurrency(code) ? "1" : "0.01";

  const resetEmpty = useCallback(() => {
    setFinalMajor("");
    setNotes("");
  }, []);

  const loadPrefill = useCallback(async (id: string) => {
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
    } finally {
      setLoadingPrefill(false);
    }
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionId) return;

    const amt = Number(finalMajor);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Enter a valid final payment amount");
      return;
    }

    setSubmitting(true);
    try {
      const res = await requestFinalPayment({
        submissionId,
        finalPaymentAmount: amt,
        notes: notes.trim() || undefined,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-brand-dark-neutral-200 bg-brand-light-neutral-50">
        <DialogHeader>
          <DialogTitle>Request final payment</DialogTitle>
          <DialogDescription>
            Set the remaining balance and notify the buyer to pay.
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
  );
}


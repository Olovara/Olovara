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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  getCustomOrderSubmissionDetail,
  sendCustomOrderQuote,
} from "@/actions/customOrderFormActions";
import { SendCustomOrderQuoteSchema } from "@/schemas/CustomOrderQuoteSchema";
import { isZeroDecimalCurrency, minorToMajorAmount } from "@/data/units";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type PriceType = "FIXED" | "RANGE";

export default function SendCustomOrderQuoteDialog({
  open,
  onOpenChange,
  submissionId,
  currency,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissionId: string | null;
  currency: string;
  onSent?: () => void;
}) {
  const [loadingPrefill, setLoadingPrefill] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [priceType, setPriceType] = useState<PriceType>("FIXED");
  const [fixedMajor, setFixedMajor] = useState("");
  const [minMajor, setMinMajor] = useState("");
  const [maxMajor, setMaxMajor] = useState("");
  const [depositMajor, setDepositMajor] = useState("");
  const [timeline, setTimeline] = useState("");
  const [notes, setNotes] = useState("");
  /** Filled from server prefill so inputs match submission currency (not list default). */
  const [resolvedCurrency, setResolvedCurrency] = useState(currency);

  const code = resolvedCurrency?.trim() || "USD";
  const step = isZeroDecimalCurrency(code) ? "1" : "0.01";

  const resetEmpty = useCallback(() => {
    setPriceType("FIXED");
    setFixedMajor("");
    setMinMajor("");
    setMaxMajor("");
    setDepositMajor("");
    setTimeline("");
    setNotes("");
  }, []);

  const loadPrefill = useCallback(async (id: string) => {
    setLoadingPrefill(true);
    try {
      const res = await getCustomOrderSubmissionDetail(id);
      if (res.error || !res.data) return;
      const d = res.data;
      const cur = d.currency || "USD";
      setResolvedCurrency(cur);
      if (d.quotePriceType === "RANGE") {
        setPriceType("RANGE");
        if (d.quotePriceMinMinor != null) {
          setMinMajor(String(minorToMajorAmount(d.quotePriceMinMinor, cur)));
        }
        if (d.quotePriceMaxMinor != null) {
          setMaxMajor(String(minorToMajorAmount(d.quotePriceMaxMinor, cur)));
        }
        setFixedMajor("");
      } else if (d.quotePriceType === "FIXED" || d.quotePriceFixedMinor != null) {
        setPriceType("FIXED");
        if (d.quotePriceFixedMinor != null) {
          setFixedMajor(String(minorToMajorAmount(d.quotePriceFixedMinor, cur)));
        }
        setMinMajor("");
        setMaxMajor("");
      } else {
        setPriceType("FIXED");
        setFixedMajor("");
        setMinMajor("");
        setMaxMajor("");
      }
      if (d.quoteDepositMinor != null) {
        setDepositMajor(String(minorToMajorAmount(d.quoteDepositMinor, cur)));
      } else {
        setDepositMajor("");
      }
      setTimeline(d.quoteTimeline ?? "");
      setNotes(d.quoteNotes ?? "");
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

    const parseNum = (s: string) => {
      const t = s.trim().replace(",", ".");
      if (t === "") return undefined;
      const n = parseFloat(t);
      return Number.isFinite(n) ? n : NaN;
    };

    const payload = {
      submissionId,
      quotePriceType: priceType,
      quotePriceFixedMajor:
        priceType === "FIXED" ? parseNum(fixedMajor) : undefined,
      quotePriceMinMajor: priceType === "RANGE" ? parseNum(minMajor) : undefined,
      quotePriceMaxMajor: priceType === "RANGE" ? parseNum(maxMajor) : undefined,
      quoteDepositMajor: parseNum(depositMajor),
      quoteTimeline: timeline.trim(),
      quoteNotes: notes.trim() || undefined,
    };

    const parsed = SendCustomOrderQuoteSchema.safeParse(payload);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Check the form";
      toast.error(msg);
      return;
    }

    setSubmitting(true);
    try {
      const res = await sendCustomOrderQuote(parsed.data);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? "Quote sent");
      onOpenChange(false);
      onSent?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-brand-dark-neutral-200 bg-brand-light-neutral-50 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send quote to buyer</DialogTitle>
          <DialogDescription>
            Share your price estimate, required deposit, and timeline before you
            accept the request. The buyer receives an email summary.
          </DialogDescription>
        </DialogHeader>

        {loadingPrefill ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-md border border-brand-dark-neutral-200 bg-brand-light-neutral-100/70 p-3 text-sm text-muted-foreground">
              Olovara takes a commission on payments and Stripe has payment processing fees. Price your deposit and final amount
              accordingly so you receive the amount you expect after fees.
            </div>
            <div className="space-y-2">
              <Label>Price estimate</Label>
              <RadioGroup
                value={priceType}
                onValueChange={(v) => setPriceType(v as PriceType)}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="FIXED" id="qt-fixed" />
                  <Label htmlFor="qt-fixed" className="font-normal">
                    Fixed
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="RANGE" id="qt-range" />
                  <Label htmlFor="qt-range" className="font-normal">
                    Range
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {priceType === "FIXED" ? (
              <div className="space-y-2">
                <Label htmlFor="quote-fixed">Amount ({code})</Label>
                <Input
                  id="quote-fixed"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={step}
                  value={fixedMajor}
                  onChange={(e) => setFixedMajor(e.target.value)}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quote-min">Low ({code})</Label>
                  <Input
                    id="quote-min"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={step}
                    value={minMajor}
                    onChange={(e) => setMinMajor(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quote-max">High ({code})</Label>
                  <Input
                    id="quote-max"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={step}
                    value={maxMajor}
                    onChange={(e) => setMaxMajor(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quote-deposit">Required deposit ({code})</Label>
              <Input
                id="quote-deposit"
                type="number"
                inputMode="decimal"
                min={0}
                step={step}
                value={depositMajor}
                onChange={(e) => setDepositMajor(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quote-timeline">Timeline</Label>
              <Input
                id="quote-timeline"
                placeholder="e.g. 2–3 weeks after deposit"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quote-notes">Notes (optional)</Label>
              <Textarea
                id="quote-notes"
                rows={3}
                placeholder="Materials, shipping assumptions, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
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
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send quote"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

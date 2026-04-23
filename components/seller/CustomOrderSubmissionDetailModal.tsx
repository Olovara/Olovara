"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  getCustomOrderSubmissionDetail,
  sellerStartCustomOrderWork,
} from "@/actions/customOrderFormActions";
import type { CustomOrderSubmissionDetail } from "@/actions/customOrderFormActions";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn, formatPriceInCurrency } from "@/lib/utils";
import SendCustomOrderQuoteDialog from "@/components/seller/SendCustomOrderQuoteDialog";
import CustomOrderProjectThread from "@/components/custom-order/CustomOrderProjectThread";
import RequestFinalPaymentDialog from "@/components/seller/RequestFinalPaymentDialog";

function detailStatusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "PENDING":
      return "secondary";
    case "QUOTED":
    case "REVIEWED":
    case "APPROVED":
    case "PENDING_SELLER_START":
    case "IN_PROGRESS":
    case "READY_FOR_FINAL_PAYMENT":
      return "default";
    case "COMPLETED":
      return "outline";
    case "REJECTED":
      return "destructive";
    default:
      return "outline";
  }
}

function quoteActionDisabled(status: string) {
  return (
    status === "APPROVED" ||
    status === "REVIEWED" ||
    status === "PENDING_SELLER_START" ||
    status === "IN_PROGRESS" ||
    status === "READY_FOR_FINAL_PAYMENT" ||
    status === "COMPLETED" ||
    status === "REJECTED"
  );
}

function rejectDisabled(status: string) {
  return status === "REJECTED" || status === "COMPLETED";
}

export default function CustomOrderSubmissionDetailModal({
  submissionId,
  open,
  onOpenChange,
  onRequestReject,
  refreshTrigger = 0,
}: {
  submissionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Opens parent reject confirmation (reason + email to buyer). */
  onRequestReject?: () => void;
  /** Increment after reject to reload detail while modal stays open. */
  refreshTrigger?: number;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<CustomOrderSubmissionDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [startWorkBusy, setStartWorkBusy] = useState(false);
  const [finalDialogOpen, setFinalDialogOpen] = useState(false);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setLoadError(null);
    setDetail(null);
    const res = await getCustomOrderSubmissionDetail(id);
    setLoading(false);
    if (res.error) {
      setLoadError(res.error);
      return;
    }
    if (res.data) {
      setDetail(res.data);
    } else {
      setLoadError("No data returned");
    }
  }, []);

  useEffect(() => {
    if (open && submissionId) {
      void load(submissionId);
    }
    if (!open) {
      setDetail(null);
      setLoadError(null);
    }
  }, [open, submissionId, load]);

  useEffect(() => {
    if (refreshTrigger > 0 && open && submissionId) {
      void load(submissionId);
    }
  }, [refreshTrigger, open, submissionId, load]);

  const statusBusy = false;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex flex-col gap-0 overflow-hidden border-brand-dark-neutral-200 bg-brand-light-neutral-50 p-0",
          // Mobile: full screen using dynamic viewport (fits under browser chrome / notches)
          "max-sm:fixed max-sm:inset-0 max-sm:z-50 max-sm:m-0 max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none",
          // Desktop: centered dialog
          "sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[90vh] sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg",
          // Radix close button: respect safe area on small screens
          "[&>button.absolute]:max-sm:top-[max(1rem,env(safe-area-inset-top,0px))] [&>button.absolute]:max-sm:right-[max(1rem,env(safe-area-inset-right,0px))]",
        )}
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-brand-dark-neutral-200 px-4 py-4 text-left max-sm:pt-[max(1rem,env(safe-area-inset-top,0px))] sm:px-6">
          <DialogTitle>Submission details</DialogTitle>
          <DialogDescription>
            What the customer entered on your custom order form.
          </DialogDescription>
        </DialogHeader>

        {/* flex-1 + min-h-0 + overflow-y-auto: scrolls full body; Radix ScrollArea h-full was clipping content */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          )}
          {!loading && loadError && (
            <p className="text-sm text-destructive">{loadError}</p>
          )}
          {!loading && !loadError && detail && (
            <div className="space-y-6 pb-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Form
                </p>
                <p className="mt-1 font-medium">{detail.formTitle}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant={detailStatusVariant(detail.status)}>
                    {detail.status.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(detail.createdAt), "MMM d, yyyy h:mm a")}
                  </span>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Buyer budget
                </p>
                {detail.customerBudgetMinor != null ? (
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="font-medium">
                      {formatPriceInCurrency(
                        detail.customerBudgetMinor,
                        (detail.customerBudgetCurrency || detail.currency || "USD")
                          .trim()
                          .toUpperCase(),
                        true,
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Buyer entered this in{" "}
                      {detail.customerBudgetCurrency || detail.currency || "USD"}.
                      {detail.customerBudgetCurrency &&
                        detail.customerBudgetCurrency !== detail.currency && (
                          <>
                            {" "}
                            Shop pricing currency: {detail.currency}.
                          </>
                        )}
                    </p>
                    <p className="text-muted-foreground">
                      Flexible on budget:{" "}
                      <span className="text-foreground">
                        {detail.budgetFlexible ? "Yes" : "No"}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Not provided (submitted before budget was required)
                  </p>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Reference images
                </p>
                {detail.referenceImageUrls.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No reference images uploaded.
                  </p>
                ) : (
                  <ul className="mt-2 flex flex-wrap gap-3">
                    {detail.referenceImageUrls.map((url, index) => (
                      <li key={`${url}-${index}`}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-md border border-brand-dark-neutral-200 bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-400"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Reference ${index + 1}`}
                            className="h-28 w-28 rounded-md object-cover"
                          />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {detail.quoteSentAt &&
                (detail.quotePriceType === "FIXED" ||
                  detail.quotePriceType === "RANGE") && (
                  <>
                    <Separator />
                    <div className="rounded-md border border-brand-dark-neutral-200 bg-brand-light-neutral-100/80 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Quote sent to buyer
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {format(
                          new Date(detail.quoteSentAt),
                          "MMM d, yyyy h:mm a",
                        )}
                      </p>
                      <dl className="mt-3 space-y-2 text-sm">
                        <div>
                          <dt className="text-muted-foreground">Estimate</dt>
                          <dd className="font-medium">
                            {detail.quotePriceType === "FIXED" &&
                            detail.quotePriceFixedMinor != null
                              ? formatPriceInCurrency(
                                  detail.quotePriceFixedMinor,
                                  detail.currency,
                                  true,
                                )
                              : detail.quotePriceMinMinor != null &&
                                  detail.quotePriceMaxMinor != null
                                ? `${formatPriceInCurrency(
                                    detail.quotePriceMinMinor,
                                    detail.currency,
                                    true,
                                  )} – ${formatPriceInCurrency(
                                    detail.quotePriceMaxMinor,
                                    detail.currency,
                                    true,
                                  )}`
                                : "—"}
                          </dd>
                        </div>
                        {detail.quoteDepositMinor != null && (
                          <div>
                            <dt className="text-muted-foreground">
                              Required deposit
                            </dt>
                            <dd className="font-medium">
                              {formatPriceInCurrency(
                                detail.quoteDepositMinor,
                                detail.currency,
                                true,
                              )}
                            </dd>
                          </div>
                        )}
                        {detail.quoteTimeline && (
                          <div>
                            <dt className="text-muted-foreground">Timeline</dt>
                            <dd className="font-medium whitespace-pre-wrap">
                              {detail.quoteTimeline}
                            </dd>
                          </div>
                        )}
                        {detail.quoteNotes && (
                          <div>
                            <dt className="text-muted-foreground">Notes</dt>
                            <dd className="mt-1 whitespace-pre-wrap text-muted-foreground">
                              {detail.quoteNotes}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </>
                )}

              {detail.status === "REJECTED" && detail.rejectionReason && (
                <>
                  <Separator />
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-destructive">
                      Message sent to buyer
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm">
                      {detail.rejectionReason}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Contact
                </p>
                <div className="mt-2 space-y-1 text-sm">
                  {detail.customerName && (
                    <p>
                      <span className="text-muted-foreground">Name: </span>
                      {detail.customerName}
                    </p>
                  )}
                  <p className="break-all">
                    <span className="text-muted-foreground">Email: </span>
                    {detail.customerEmail || "—"}
                  </p>
                  {(detail.buyerUsername || detail.buyerEmail) && (
                    <p className="text-muted-foreground">
                      Account:{" "}
                      {detail.buyerUsername
                        ? `@${detail.buyerUsername}`
                        : detail.buyerEmail}
                    </p>
                  )}
                </div>
              </div>

              {detail.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Your notes
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm">{detail.notes}</p>
                  </div>
                </>
              )}

              <Separator />

              <CustomOrderProjectThread submissionId={detail.id} />

              <Separator />

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Customer request
                </p>
                {detail.answers.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No field responses were saved for this submission.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-4">
                    {detail.answers.map((a) => (
                      <li
                        key={a.fieldId}
                        className="rounded-md border border-brand-dark-neutral-200 bg-brand-light-neutral-100/80 p-3"
                      >
                        <p className="text-sm font-medium">{a.label}</p>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                          {a.displayValue}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 flex-col gap-2 border-t border-brand-dark-neutral-200 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:flex-row sm:justify-end sm:gap-2 sm:px-6 sm:pb-4">
          {detail && submissionId && (
            <>
              {detail.status === "PENDING_SELLER_START" && (
                <Button
                  type="button"
                  variant="default"
                  disabled={loading || startWorkBusy}
                  onClick={async () => {
                    setStartWorkBusy(true);
                    try {
                      const res = await sellerStartCustomOrderWork(submissionId);
                      if (res.error) {
                        toast.error(res.error);
                        return;
                      }
                      toast.success(res.success ?? "Work started");
                      await load(submissionId);
                      router.refresh();
                    } finally {
                      setStartWorkBusy(false);
                    }
                  }}
                >
                  {startWorkBusy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting…
                    </>
                  ) : (
                    "Confirm & start work"
                  )}
                </Button>
              )}
              <Button
                type="button"
                variant="outlinePrimary"
                disabled={
                  loading ||
                  quoteActionDisabled(detail.status)
                }
                onClick={() => setQuoteDialogOpen(true)}
              >
                {detail.status === "QUOTED" ? "Update quote" : "Send quote"}
              </Button>
              {detail.status === "IN_PROGRESS" && (
                <Button
                  type="button"
                  variant="default"
                  disabled={loading}
                  onClick={() => setFinalDialogOpen(true)}
                >
                  Request final payment
                </Button>
              )}
              <Button
                type="button"
                variant="destructive"
                disabled={
                  loading ||
                  rejectDisabled(detail.status) ||
                  !onRequestReject
                }
                onClick={() => onRequestReject?.()}
              >
                Reject
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="outlinePrimary"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <SendCustomOrderQuoteDialog
      open={quoteDialogOpen}
      onOpenChange={setQuoteDialogOpen}
      submissionId={submissionId}
      currency={detail?.currency ?? "USD"}
      onSent={() => {
        if (submissionId) void load(submissionId);
        router.refresh();
      }}
    />

    <RequestFinalPaymentDialog
      open={finalDialogOpen}
      onOpenChange={setFinalDialogOpen}
      submissionId={submissionId}
      currency={detail?.currency ?? "USD"}
      onRequested={() => {
        if (submissionId) void load(submissionId);
        router.refresh();
      }}
    />
  </>
  );
}

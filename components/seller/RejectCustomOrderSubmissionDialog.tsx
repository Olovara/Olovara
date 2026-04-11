"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateSubmissionStatus } from "@/actions/customOrderFormActions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_LEN = 2000;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissionId: string | null;
  /** Called after a successful reject (e.g. refresh list / detail). */
  onRejected?: () => void;
};

export default function RejectCustomOrderSubmissionDialog({
  open,
  onOpenChange,
  submissionId,
  onRejected,
}: Props) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setReason("");
      setSubmitting(false);
    }
  }, [open]);

  const trimmed = reason.trim();
  const canSubmit = trimmed.length > 0 && submissionId && !submitting;

  const handleConfirm = async () => {
    if (!submissionId || !trimmed) return;
    setSubmitting(true);
    try {
      const res = await updateSubmissionStatus({
        submissionId,
        status: "REJECTED",
        rejectionReason: trimmed,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        "Request rejected. The buyer was emailed your message (if email delivery succeeded).",
      );
      onOpenChange(false);
      onRejected?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "z-[100] border-brand-dark-neutral-200 bg-brand-light-neutral-50 sm:max-w-md",
          "max-sm:mx-4 max-sm:max-h-[90dvh] max-sm:overflow-y-auto",
        )}
      >
        <DialogHeader>
          <DialogTitle>Reject this request?</DialogTitle>
          <DialogDescription>
            The buyer will receive an email with the message below. Be clear and
            professional - they can reply or contact you on OLOVARA.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="reject-reason">Reason for rejection</Label>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, MAX_LEN))}
            placeholder="e.g. We can’t take this type of commission right now, but thank you for your interest."
            className="min-h-[120px] border-brand-dark-neutral-200 bg-brand-light-neutral-50"
            disabled={submitting}
          />
          <p className="text-xs text-muted-foreground text-right">
            {reason.length}/{MAX_LEN}
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outlinePrimary"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!canSubmit}
            onClick={() => void handleConfirm()}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Reject request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

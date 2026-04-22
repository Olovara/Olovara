"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { format } from "date-fns";
import {
  addProgressUpdateComment,
  createSellerProgressUpdate,
  getCustomOrderProjectThread,
  respondToProgressApproval,
  type ProjectThreadData,
  type ProjectTimelineRow,
} from "@/actions/customOrderProjectThreadActions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatPriceInCurrency } from "@/lib/utils";
import { uploadCustomOrderProgressImages } from "@/lib/upload-custom-order-progress-images";
import { CUSTOM_ORDER_MAX_PROGRESS_IMAGES } from "@/lib/custom-order-progress-config";
import { toast } from "sonner";
import {
  CheckCircle2,
  CreditCard,
  FileText,
  ImageIcon,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
} from "lucide-react";

function formatWhen(iso: string) {
  try {
    return format(new Date(iso), "MMM d, yyyy 'at' h:mm a");
  } catch {
    return iso;
  }
}

function TimelineShell({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="relative flex gap-3 rounded-lg border border-brand-dark-neutral-200 bg-background p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-light-neutral-100 text-brand-primary-700">
        {icon}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium leading-snug">{title}</p>
        {children}
      </div>
    </div>
  );
}

function SellerUpdateCard({
  row,
  role,
  submissionStatus,
  onChanged,
}: {
  row: Extract<ProjectTimelineRow, { kind: "seller_update" }>;
  role: "buyer" | "seller";
  submissionStatus: string;
  onChanged: () => void;
}) {
  const u = row.update;
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [showReject, setShowReject] = useState(false);

  const onComment = async () => {
    const t = comment.trim();
    if (!t) return;
    setBusy(true);
    try {
      const res = await addProgressUpdateComment({
        updateId: u.id,
        body: t,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? "Posted");
      setComment("");
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const onApprove = async () => {
    setBusy(true);
    try {
      const res = await respondToProgressApproval({
        updateId: u.id,
        decision: "APPROVED",
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? "Approved");
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const onReject = async () => {
    setBusy(true);
    try {
      const res = await respondToProgressApproval({
        updateId: u.id,
        decision: "REJECTED",
        note: rejectNote.trim() || undefined,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Response recorded");
      setShowReject(false);
      setRejectNote("");
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const canComment =
    submissionStatus !== "REJECTED" && submissionStatus !== "COMPLETED";
  const showApproval =
    role === "buyer" &&
    u.requiresApproval &&
    u.approvalStatus === "PENDING" &&
    canComment;

  return (
    <div className="space-y-3 rounded-lg border border-brand-primary-700/25 bg-brand-light-neutral-100/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="default" className="text-xs">
          Seller update
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatWhen(u.createdAt)}
        </span>
        {u.requiresApproval && (
          <Badge variant="outline" className="text-xs">
            Approval requested
          </Badge>
        )}
      </div>
      {u.body ? (
        <p className="whitespace-pre-wrap text-sm">{u.body}</p>
      ) : null}
      {u.imageUrls.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {u.imageUrls.map((url, i) => (
            <li key={`${url}-${i}`}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-md border border-brand-dark-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-400"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Progress ${i + 1}`}
                  className="h-32 w-32 rounded-md object-cover"
                />
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {u.requiresApproval && u.approvalStatus && u.approvalStatus !== "PENDING" && (
        <div className="rounded-md border border-brand-dark-neutral-200 bg-background px-3 py-2 text-sm">
          {u.approvalStatus === "APPROVED" ? (
            <p className="text-emerald-700">
              Buyer approved
              {u.approvalDecidedAt
                ? ` · ${formatWhen(u.approvalDecidedAt)}`
                : ""}
            </p>
          ) : (
            <div>
              <p className="text-destructive">
                Buyer did not approve
                {u.approvalDecidedAt
                  ? ` · ${formatWhen(u.approvalDecidedAt)}`
                  : ""}
              </p>
              {u.buyerRejectionNote ? (
                <p className="mt-1 text-muted-foreground whitespace-pre-wrap">
                  {u.buyerRejectionNote}
                </p>
              ) : null}
            </div>
          )}
        </div>
      )}

      {showApproval && (
        <div className="space-y-2 rounded-md border border-amber-200/80 bg-amber-50/80 p-3 dark:bg-amber-950/20">
          <p className="text-sm font-medium">Your approval is requested</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => void onApprove()}
            >
              Approve
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => setShowReject((v) => !v)}
            >
              Reject
            </Button>
          </div>
          {showReject && (
            <div className="space-y-2">
              <Textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Optional note to the seller"
                rows={2}
                className="resize-none text-sm"
              />
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={busy}
                onClick={() => void onReject()}
              >
                Submit rejection
              </Button>
            </div>
          )}
        </div>
      )}

      {u.comments.length > 0 && (
        <ul className="space-y-2 border-t border-brand-dark-neutral-200/80 pt-3">
          {u.comments.map((c) => (
            <li
              key={c.id}
              className="rounded-md bg-background/80 px-3 py-2 text-sm"
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                <span className="font-medium">{c.displayName}</span>
                <span className="text-xs text-muted-foreground">
                  {formatWhen(c.createdAt)}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                {c.body}
              </p>
            </li>
          ))}
        </ul>
      )}

      {canComment && (
        <div className="flex flex-col gap-2 border-t border-brand-dark-neutral-200/80 pt-3 sm:flex-row sm:items-end">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment…"
            rows={2}
            className="min-h-[72px] flex-1 resize-none text-sm"
          />
          <Button
            type="button"
            variant="outlinePrimary"
            size="sm"
            className="shrink-0"
            disabled={busy || !comment.trim()}
            onClick={() => void onComment()}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <MessageCircle className="mr-1.5 h-4 w-4" />
                Comment
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function CustomOrderProjectThread({
  submissionId,
}: {
  submissionId: string;
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProjectThreadData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const res = await getCustomOrderProjectThread(submissionId);
    setLoading(false);
    if (res.error) {
      setErr(res.error);
      setData(null);
      return;
    }
    setData(res.data ?? null);
  }, [submissionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [postBusy, setPostBusy] = useState(false);

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    const next = [...files, ...Array.from(list)].slice(
      0,
      CUSTOM_ORDER_MAX_PROGRESS_IMAGES,
    );
    setFiles(next);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((f) => f.filter((_, i) => i !== index));
  };

  const onPost = async () => {
    if (!data || data.role !== "seller") return;
    const text = body.trim();
    if (!text && files.length === 0) {
      toast.error("Add a note and/or images");
      return;
    }
    setPostBusy(true);
    try {
      let imageUrls: string[] = [];
      if (files.length > 0) {
        const up = await uploadCustomOrderProgressImages(files);
        imageUrls = up.urls;
      }
      const res = await createSellerProgressUpdate({
        submissionId,
        body: text || undefined,
        imageUrls,
        requiresApproval,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? "Posted");
      setBody("");
      setFiles([]);
      setRequiresApproval(false);
      await load();
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : "Could not upload or post update",
      );
    } finally {
      setPostBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading project timeline…
      </div>
    );
  }
  if (err || !data) {
    return (
      <p className="py-4 text-sm text-destructive">
        {err ?? "Could not load timeline"}
      </p>
    );
  }

  const { timeline, role, currency, submissionStatus } = data;
  const showComposer =
    role === "seller" &&
    submissionStatus !== "REJECTED" &&
    submissionStatus !== "COMPLETED";

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Project timeline
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Full history of your custom order: quotes, payments, updates, and
          completion.
        </p>
      </div>

      <div className="space-y-3">
        {timeline.map((row, idx) => {
          const key = `${row.kind}-${row.at}-${idx}`;
          if (row.kind === "submitted") {
            return (
              <TimelineShell
                key={key}
                icon={<Send className="h-4 w-4" />}
                title="Request submitted"
              >
                <p className="text-xs text-muted-foreground">
                  {formatWhen(row.at)}
                </p>
              </TimelineShell>
            );
          }
          if (row.kind === "quote") {
            return (
              <TimelineShell
                key={key}
                icon={<FileText className="h-4 w-4" />}
                title={row.isUpdate ? "Quote updated" : "Quote sent"}
              >
                <p className="text-xs text-muted-foreground">
                  {formatWhen(row.at)}
                </p>
                <dl className="mt-2 space-y-1 text-sm">
                  {row.quotePriceType === "FIXED" &&
                  row.quotePriceFixedMinor != null ? (
                    <div>
                      <dt className="text-muted-foreground">Estimate</dt>
                      <dd className="font-medium">
                        {formatPriceInCurrency(
                          row.quotePriceFixedMinor,
                          currency,
                          true,
                        )}
                      </dd>
                    </div>
                  ) : row.quotePriceMinMinor != null &&
                    row.quotePriceMaxMinor != null ? (
                    <div>
                      <dt className="text-muted-foreground">Estimate</dt>
                      <dd className="font-medium">
                        {formatPriceInCurrency(
                          row.quotePriceMinMinor,
                          currency,
                          true,
                        )}{" "}
                        –{" "}
                        {formatPriceInCurrency(
                          row.quotePriceMaxMinor,
                          currency,
                          true,
                        )}
                      </dd>
                    </div>
                  ) : null}
                  {row.quoteDepositMinor != null && (
                    <div>
                      <dt className="text-muted-foreground">Deposit</dt>
                      <dd className="font-medium">
                        {formatPriceInCurrency(
                          row.quoteDepositMinor,
                          currency,
                          true,
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              </TimelineShell>
            );
          }
          if (row.kind === "deposit_paid") {
            return (
              <TimelineShell
                key={key}
                icon={<CreditCard className="h-4 w-4" />}
                title="Deposit paid"
              >
                <p className="text-xs text-muted-foreground">
                  {formatWhen(row.at)}
                </p>
                <p className="text-sm font-medium">
                  {formatPriceInCurrency(row.amountMinor, row.currency, true)}
                </p>
              </TimelineShell>
            );
          }
          if (row.kind === "final_payment") {
            return (
              <TimelineShell
                key={key}
                icon={<CreditCard className="h-4 w-4" />}
                title="Final payment received"
              >
                <p className="text-xs text-muted-foreground">
                  {formatWhen(row.at)}
                </p>
                <p className="text-sm font-medium">
                  {formatPriceInCurrency(row.amountMinor, row.currency, true)}
                </p>
              </TimelineShell>
            );
          }
          if (row.kind === "project_completed") {
            return (
              <TimelineShell
                key={key}
                icon={<CheckCircle2 className="h-4 w-4" />}
                title="Project marked complete"
              >
                <p className="text-xs text-muted-foreground">
                  {formatWhen(row.at)}
                </p>
              </TimelineShell>
            );
          }
          if (row.kind === "seller_update") {
            return (
              <div key={key}>
                <SellerUpdateCard
                  row={row}
                  role={role}
                  submissionStatus={submissionStatus}
                  onChanged={() => void load()}
                />
              </div>
            );
          }
          return null;
        })}
      </div>

      {showComposer && (
        <div className="space-y-3 rounded-lg border border-dashed border-brand-dark-neutral-300 bg-brand-light-neutral-50/80 p-3">
          <p className="text-sm font-medium">Post an update for the buyer</p>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write an update (optional if you add images)"
            rows={4}
            className="resize-none text-sm"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                <ImageIcon className="mr-1.5 inline h-4 w-4" />
                Add images ({files.length}/{CUSTOM_ORDER_MAX_PROGRESS_IMAGES})
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={onPickFiles}
                />
              </label>
            </Button>
          </div>
          {files.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
                >
                  <span className="max-w-[10rem] truncate">{f.name}</span>
                  <button
                    type="button"
                    className="text-destructive"
                    onClick={() => removeFile(i)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-2">
            <Checkbox
              id={`req-appr-${submissionId}`}
              checked={requiresApproval}
              onCheckedChange={(v) => setRequiresApproval(Boolean(v))}
            />
            <Label
              htmlFor={`req-appr-${submissionId}`}
              className="text-sm font-normal"
            >
              Ask the buyer to approve this update
            </Label>
          </div>
          <Button
            type="button"
            disabled={postBusy}
            onClick={() => void onPost()}
          >
            {postBusy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Post update
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

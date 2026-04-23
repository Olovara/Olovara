"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  CreateProgressUpdateSchema,
  ProgressApprovalResponseSchema,
  ProgressCommentSchema,
} from "@/schemas/CustomOrderProjectThreadSchema";
import { CUSTOM_ORDER_MAX_PROGRESS_IMAGES } from "@/lib/custom-order-progress-config";

export type ProjectThreadRole = "buyer" | "seller";

export type ProgressCommentPayload = {
  id: string;
  body: string;
  createdAt: string;
  isSeller: boolean;
  isMe: boolean;
  displayName: string;
};

export type ProgressUpdatePayload = {
  id: string;
  body: string | null;
  imageUrls: string[];
  requiresApproval: boolean;
  approvalStatus: string | null;
  approvalDecidedAt: string | null;
  buyerRejectionNote: string | null;
  createdAt: string;
  comments: ProgressCommentPayload[];
};

export type ProjectTimelineRow =
  | { kind: "submitted"; at: string }
  | {
      kind: "quote";
      at: string;
      isUpdate: boolean;
      quotePriceType: string | null;
      quotePriceFixedMinor: number | null;
      quotePriceMinMinor: number | null;
      quotePriceMaxMinor: number | null;
      quoteDepositMinor: number | null;
      quoteTimeline: string | null;
      quoteNotes: string | null;
    }
  | {
      kind: "deposit_paid";
      at: string;
      amountMinor: number;
      currency: string;
    }
  | { kind: "work_started"; at: string }
  | { kind: "seller_update"; at: string; update: ProgressUpdatePayload }
  | {
      kind: "final_payment_requested";
      at: string;
      amountMinor: number;
      currency: string;
    }
  | {
      kind: "final_payment";
      at: string;
      amountMinor: number;
      currency: string;
    }
  | { kind: "project_completed"; at: string };

export type ProjectThreadData = {
  role: ProjectThreadRole;
  currency: string;
  submissionStatus: string;
  /** When true, no new seller posts or comments/approvals (final payment was requested or order ended). */
  threadLocked: boolean;
  timeline: ProjectTimelineRow[];
};

function isThreadLocked(
  status: string,
  finalPaymentRequestedAt: Date | null | undefined,
): boolean {
  if (
    status === "READY_FOR_FINAL_PAYMENT" ||
    status === "COMPLETED" ||
    status === "REJECTED"
  ) {
    return true;
  }
  return finalPaymentRequestedAt != null;
}

/** When timestamps tie, keep a consistent order so “requested” never hides “received”. */
const TIMELINE_KIND_ORDER: Partial<
  Record<ProjectTimelineRow["kind"], number>
> = {
  submitted: 0,
  quote: 10,
  deposit_paid: 20,
  work_started: 25,
  seller_update: 30,
  final_payment_requested: 40,
  final_payment: 41,
  project_completed: 50,
};

function sortTimelineRows(timeline: ProjectTimelineRow[]) {
  timeline.sort((a, b) => {
    const ta = new Date(a.at).getTime();
    const tb = new Date(b.at).getTime();
    if (ta !== tb) return ta - tb;
    return (
      (TIMELINE_KIND_ORDER[a.kind] ?? 100) -
      (TIMELINE_KIND_ORDER[b.kind] ?? 100)
    );
  });
}

/** Legacy rows may lack `finalPaymentRequestedAt` after final payment — still show both steps. */
function ensureFinalPaymentRequestedRowIfMissing(
  timeline: ProjectTimelineRow[],
  currency: string,
  submissionCreatedAt: Date,
  finalPaymentAmountMinor: number | null | undefined,
) {
  const hasRequested = timeline.some((e) => e.kind === "final_payment_requested");
  if (hasRequested) return;

  const paidEntries = timeline.filter(
    (e): e is Extract<ProjectTimelineRow, { kind: "final_payment" }> =>
      e.kind === "final_payment",
  );
  if (paidEntries.length === 0) return;

  const amt = finalPaymentAmountMinor;
  if (amt == null || amt <= 0) return;

  const paidAtMs = Math.min(
    ...paidEntries.map((e) => new Date(e.at).getTime()),
  );
  const requestedAtMs = Math.max(submissionCreatedAt.getTime(), paidAtMs - 1);

  timeline.push({
    kind: "final_payment_requested",
    at: new Date(requestedAtMs).toISOString(),
    amountMinor: amt,
    currency,
  });
}

async function assertParticipant(submissionId: string, userId: string) {
  const row = await db.customOrderSubmission.findFirst({
    where: { id: submissionId },
    select: {
      id: true,
      userId: true,
      form: { select: { sellerId: true } },
    },
  });
  if (!row) return { error: "Submission not found" as const };
  if (row.userId === userId) {
    return { submission: row, role: "buyer" as const };
  }
  if (row.form.sellerId === userId) {
    return { submission: row, role: "seller" as const };
  }
  return { error: "Unauthorized" as const };
}

function revalidateCustomOrderPaths() {
  revalidatePath("/member/dashboard/custom-orders");
  revalidatePath("/seller/dashboard/custom-orders/submissions");
}

export async function getCustomOrderProjectThread(submissionId: string): Promise<
  | { error: string; data?: undefined }
  | { data: ProjectThreadData; error?: undefined }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const part = await assertParticipant(submissionId, session.user.id);
  if ("error" in part && part.error) {
    return { error: part.error };
  }
  const { role } = part;

  try {
    const row = await db.customOrderSubmission.findFirst({
      where: { id: submissionId },
      include: {
        form: { select: { sellerId: true } },
        payments: {
          where: { status: "COMPLETED" },
          orderBy: { createdAt: "asc" },
        },
        quoteSnapshots: { orderBy: { sentAt: "asc" } },
        progressUpdates: {
          orderBy: { createdAt: "asc" },
          include: {
            comments: {
              orderBy: { createdAt: "asc" },
              include: {
                user: { select: { id: true, username: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!row) return { error: "Submission not found" };

    const currency = (row.currency || "USD").trim().toUpperCase();
    const uid = session.user.id;

    const timeline: ProjectTimelineRow[] = [];

    timeline.push({
      kind: "submitted",
      at: row.createdAt.toISOString(),
    });

    const snapshots = row.quoteSnapshots;
    if (snapshots.length === 0 && row.quoteSentAt) {
      timeline.push({
        kind: "quote",
        at: row.quoteSentAt.toISOString(),
        isUpdate: false,
        quotePriceType: row.quotePriceType ?? null,
        quotePriceFixedMinor: row.quotePriceFixedMinor ?? null,
        quotePriceMinMinor: row.quotePriceMinMinor ?? null,
        quotePriceMaxMinor: row.quotePriceMaxMinor ?? null,
        quoteDepositMinor: row.quoteDepositMinor ?? null,
        quoteTimeline: row.quoteTimeline ?? null,
        quoteNotes: row.quoteNotes ?? null,
      });
    } else {
      snapshots.forEach((snap, index) => {
        timeline.push({
          kind: "quote",
          at: snap.sentAt.toISOString(),
          isUpdate: index > 0,
          quotePriceType: snap.quotePriceType ?? null,
          quotePriceFixedMinor: snap.quotePriceFixedMinor ?? null,
          quotePriceMinMinor: snap.quotePriceMinMinor ?? null,
          quotePriceMaxMinor: snap.quotePriceMaxMinor ?? null,
          quoteDepositMinor: snap.quoteDepositMinor ?? null,
          quoteTimeline: snap.quoteTimeline ?? null,
          quoteNotes: snap.quoteNotes ?? null,
        });
      });
    }

    for (const p of row.payments) {
      const pt = p.paymentType.trim().toUpperCase();
      if (pt === "QUOTE_DEPOSIT" || pt === "MATERIALS_DEPOSIT") {
        timeline.push({
          kind: "deposit_paid",
          at: p.createdAt.toISOString(),
          amountMinor: p.amount,
          currency: (p.currency || currency).toUpperCase(),
        });
      } else if (pt === "FINAL_PAYMENT") {
        timeline.push({
          kind: "final_payment",
          at: p.createdAt.toISOString(),
          amountMinor: p.amount,
          currency: (p.currency || currency).toUpperCase(),
        });
      }
    }

    const rowEx = row as typeof row & {
      finalPaymentRequestedAt?: Date | null;
      finalPaymentAmount?: number | null;
      inProgressAt?: Date | null;
    };
    const finalReqAt = rowEx.finalPaymentRequestedAt;
    const finalAmt = rowEx.finalPaymentAmount;
    if (finalReqAt) {
      timeline.push({
        kind: "final_payment_requested",
        at: finalReqAt.toISOString(),
        amountMinor: finalAmt ?? 0,
        currency,
      });
    } else if (
      row.status === "READY_FOR_FINAL_PAYMENT" &&
      finalAmt != null &&
      finalAmt > 0
    ) {
      timeline.push({
        kind: "final_payment_requested",
        at: row.updatedAt.toISOString(),
        amountMinor: finalAmt,
        currency,
      });
    }

    if (rowEx.inProgressAt) {
      timeline.push({
        kind: "work_started",
        at: rowEx.inProgressAt.toISOString(),
      });
    }

    const sellerUserId = row.form.sellerId;

    for (const u of row.progressUpdates) {
      const comments: ProgressCommentPayload[] = u.comments.map((c) => {
        const isSellerComment = c.userId === sellerUserId;
        let displayName: string;
        if (c.userId === uid) {
          displayName = "You";
        } else if (c.user?.username?.trim()) {
          displayName = `@${c.user.username.trim()}`;
        } else {
          displayName = isSellerComment ? "Seller" : "Buyer";
        }
        return {
          id: c.id,
          body: c.body,
          createdAt: c.createdAt.toISOString(),
          isSeller: isSellerComment,
          isMe: c.userId === uid,
          displayName,
        };
      });

      timeline.push({
        kind: "seller_update",
        at: u.createdAt.toISOString(),
        update: {
          id: u.id,
          body: u.body,
          imageUrls: u.imageUrls ?? [],
          requiresApproval: u.requiresApproval,
          approvalStatus: u.approvalStatus,
          approvalDecidedAt: u.approvalDecidedAt?.toISOString() ?? null,
          buyerRejectionNote: u.buyerRejectionNote,
          createdAt: u.createdAt.toISOString(),
          comments,
        },
      });
    }

    const completedAt = row.completedAt;
    if (completedAt) {
      timeline.push({
        kind: "project_completed",
        at: completedAt.toISOString(),
      });
    } else if (row.status === "COMPLETED") {
      timeline.push({
        kind: "project_completed",
        at: row.updatedAt.toISOString(),
      });
    }

    ensureFinalPaymentRequestedRowIfMissing(
      timeline,
      currency,
      row.createdAt,
      rowEx.finalPaymentAmount,
    );

    sortTimelineRows(timeline);

    return {
      data: {
        role,
        currency,
        submissionStatus: row.status,
        threadLocked: isThreadLocked(
          row.status,
          finalReqAt ?? null,
        ),
        timeline,
      },
    };
  } catch (e) {
    console.error("getCustomOrderProjectThread:", e);
    return { error: "Failed to load project thread" };
  }
}

export async function createSellerProgressUpdate(values: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const data = CreateProgressUpdateSchema.safeParse(values);
  if (!data.success) {
    return { error: data.error.issues[0]?.message ?? "Invalid input" };
  }

  const part = await assertParticipant(data.data.submissionId, session.user.id);
  if ("error" in part && part.error) {
    return { error: part.error };
  }
  if (part.role !== "seller") {
    return { error: "Only the seller can post progress updates" };
  }

  const sub = await db.customOrderSubmission.findFirst({
    where: { id: data.data.submissionId },
    select: { status: true, finalPaymentRequestedAt: true },
  });
  if (!sub) return { error: "Submission not found" };
  if (isThreadLocked(sub.status, sub.finalPaymentRequestedAt)) {
    return { error: "This order no longer accepts new updates" };
  }

  const urls = data.data.imageUrls ?? [];
  if (urls.length > CUSTOM_ORDER_MAX_PROGRESS_IMAGES) {
    return { error: `At most ${CUSTOM_ORDER_MAX_PROGRESS_IMAGES} images` };
  }

  const requires = Boolean(data.data.requiresApproval);
  const bodyText = data.data.body?.trim() ?? "";
  if (bodyText.length === 0 && urls.length === 0) {
    return { error: "Add a note and/or at least one image" };
  }

  try {
    await db.customOrderProgressUpdate.create({
      data: {
        submissionId: data.data.submissionId,
        body: bodyText.length > 0 ? bodyText : null,
        imageUrls: urls,
        requiresApproval: requires,
        approvalStatus: requires ? "PENDING" : null,
      },
    });
    revalidateCustomOrderPaths();
    return { success: "Update posted" };
  } catch (e) {
    console.error("createSellerProgressUpdate:", e);
    return { error: "Failed to post update" };
  }
}

export async function addProgressUpdateComment(values: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const data = ProgressCommentSchema.safeParse(values);
  if (!data.success) {
    return { error: data.error.issues[0]?.message ?? "Invalid input" };
  }

  const updateRow = await db.customOrderProgressUpdate.findFirst({
    where: { id: data.data.updateId },
    select: { submissionId: true },
  });
  if (!updateRow) return { error: "Update not found" };

  const p2 = await assertParticipant(updateRow.submissionId, session.user.id);
  if ("error" in p2 && p2.error) {
    return { error: p2.error };
  }

  const sub = await db.customOrderSubmission.findFirst({
    where: { id: updateRow.submissionId },
    select: { status: true, finalPaymentRequestedAt: true },
  });
  if (!sub) return { error: "Submission not found" };
  if (isThreadLocked(sub.status, sub.finalPaymentRequestedAt)) {
    return { error: "Comments are closed for this order" };
  }

  try {
    await db.customOrderProgressComment.create({
      data: {
        updateId: data.data.updateId,
        userId: session.user.id,
        body: data.data.body.trim(),
      },
    });
    revalidateCustomOrderPaths();
    return { success: "Comment added" };
  } catch (e) {
    console.error("addProgressUpdateComment:", e);
    return { error: "Failed to add comment" };
  }
}

export async function respondToProgressApproval(values: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const data = ProgressApprovalResponseSchema.safeParse(values);
  if (!data.success) {
    return { error: data.error.issues[0]?.message ?? "Invalid input" };
  }

  const updateRow = await db.customOrderProgressUpdate.findFirst({
    where: { id: data.data.updateId },
    include: {
      submission: {
        select: { userId: true, id: true, status: true, finalPaymentRequestedAt: true },
      },
    },
  });
  if (!updateRow) return { error: "Update not found" };
  if (updateRow.submission.userId !== session.user.id) {
    return { error: "Only the buyer can respond to approval requests" };
  }
  if (
    isThreadLocked(
      updateRow.submission.status,
      updateRow.submission.finalPaymentRequestedAt,
    )
  ) {
    return { error: "This order no longer allows approval actions" };
  }
  if (!updateRow.requiresApproval) {
    return { error: "This update does not ask for approval" };
  }
  if (
    updateRow.approvalStatus === "APPROVED" ||
    updateRow.approvalStatus === "REJECTED"
  ) {
    return { error: "You already responded" };
  }

  const now = new Date();
  try {
    await db.customOrderProgressUpdate.update({
      where: { id: data.data.updateId },
      data: {
        approvalStatus: data.data.decision,
        approvalDecidedAt: now,
        buyerRejectionNote:
          data.data.decision === "REJECTED" ? data.data.note?.trim() || null : null,
      },
    });
    revalidateCustomOrderPaths();
    return { success: "Response recorded" };
  } catch (e) {
    console.error("respondToProgressApproval:", e);
    return { error: "Failed to save response" };
  }
}

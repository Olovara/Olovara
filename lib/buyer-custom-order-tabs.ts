/**
 * Maps a submission workflow status to the buyer dashboard tab bucket.
 * Keep in sync with CustomOrderSubmission.status in Prisma.
 */
export type BuyerCustomOrderTabId =
  | "requests"
  | "quotes"
  | "pending_seller_start"
  | "in_progress"
  | "awaiting_final_payment"
  | "completed"
  | "declined";

/** Seller rejection, system auto-reject, or buyer declining a quote (when that status exists). */
const DECLINED_STATUSES = new Set([
  "REJECTED",
  "DECLINED_BY_BUYER",
  "BUYER_DECLINED",
]);

export function buyerCustomOrderTabForStatus(status: string): BuyerCustomOrderTabId {
  const s = status.trim().toUpperCase();
  if (DECLINED_STATUSES.has(s)) return "declined";
  if (s === "COMPLETED") return "completed";
  if (s === "PENDING") return "requests";
  if (s === "QUOTED" || s === "REVIEWED" || s === "APPROVED") return "quotes";
  if (s === "PENDING_SELLER_START") return "pending_seller_start";
  if (s === "IN_PROGRESS") return "in_progress";
  if (s === "READY_FOR_FINAL_PAYMENT") return "awaiting_final_payment";
  // Unknown future mid-pipeline statuses: keep visible on In progress
  return "in_progress";
}

export const BUYER_CUSTOM_ORDER_TAB_ORDER: BuyerCustomOrderTabId[] = [
  "requests",
  "quotes",
  "pending_seller_start",
  "in_progress",
  "awaiting_final_payment",
  "completed",
  "declined",
];

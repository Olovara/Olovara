/**
 * Maps a submission workflow status to the buyer dashboard tab bucket.
 * Keep in sync with CustomOrderSubmission.status in Prisma.
 */
export type BuyerCustomOrderTabId =
  | "requests"
  | "quotes"
  | "active"
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
  if (s === "QUOTED") return "quotes";
  if (s === "PENDING") return "requests";
  // In progress after quote acceptance / payments (and legacy REVIEWED)
  if (
    s === "APPROVED" ||
    s === "READY_FOR_FINAL_PAYMENT" ||
    s === "REVIEWED"
  ) {
    return "active";
  }
  // Unknown future statuses: show under Active so they are not lost
  return "active";
}

export const BUYER_CUSTOM_ORDER_TAB_ORDER: BuyerCustomOrderTabId[] = [
  "requests",
  "quotes",
  "active",
  "completed",
  "declined",
];

/**
 * Buyer/seller-facing order lifecycle (mirrors `OrderStatus` in Prisma; DB may
 * still store legacy `PENDING_TRANSFER`, `HELD`, `FAILED` until migrated).
 */
export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

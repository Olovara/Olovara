/**
 * One-time migration: map legacy `Order.status` values to the new enum.
 * Run after deploying the Prisma schema: `npx tsx scripts/migrate-order-statuses.ts`
 *
 * Mappings:
 * - PENDING_TRANSFER -> PAID
 * - HELD (after payout) -> PAID
 * - FAILED -> CANCELLED
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const map: Record<string, string> = {
    PENDING_TRANSFER: "PAID",
    HELD: "PAID",
    FAILED: "CANCELLED",
  };
  for (const [from, to] of Object.entries(map)) {
    const r = await db.order.updateMany({
      where: { status: from as "PENDING_TRANSFER" | "HELD" | "FAILED" },
      data: { status: to as "PAID" | "CANCELLED" },
    });
    console.log(`Updated ${r.count} orders: ${from} -> ${to}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void db.$disconnect();
  });

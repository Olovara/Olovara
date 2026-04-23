/**
 * One-time (or repeat-safe) backfill: set `CustomOrderSubmission.sellerId` from `CustomOrderForm.sellerId`.
 * Run after deploying the schema change so seller "My Orders" can use the indexed field for older rows.
 *
 * Usage: npx tsx scripts/backfill-custom-order-submission-seller-id.ts
 *        npx tsx scripts/backfill-custom-order-submission-seller-id.ts --dry-run
 */
import { db } from "@/lib/db";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  let updated = 0;
  let skipped = 0;

  const subs = await db.customOrderSubmission.findMany({
    select: { id: true, formId: true, sellerId: true },
  });

  for (const s of subs) {
    if (s.sellerId) {
      skipped++;
      continue;
    }
    const form = await db.customOrderForm.findUnique({
      where: { id: s.formId },
      select: { sellerId: true },
    });
    if (!form?.sellerId) {
      skipped++;
      continue;
    }
    if (dryRun) {
      console.log("[dry-run] would set submission", s.id, "sellerId ->", form.sellerId);
      updated++;
      continue;
    }
    await db.customOrderSubmission.update({
      where: { id: s.id },
      data: { sellerId: form.sellerId },
    });
    updated++;
  }

  console.log(
    `[backfill-custom-order-submission-seller-id] done dryRun=${dryRun} updated=${updated} skipped=${skipped} scanned=${subs.length}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

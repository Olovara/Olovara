import { db } from "@/lib/db";
import { slugifyOrDefault } from "@/lib/slugify";

type Args = {
  dryRun: boolean;
  limit?: number;
  batchSize: number;
};

function parseArgs(argv: string[]): Args {
  const dryRun = argv.includes("--dry-run");
  const limitArg = argv.find((a) => a.startsWith("--limit="));
  const batchArg = argv.find((a) => a.startsWith("--batch-size="));

  const limit = limitArg ? Number(limitArg.split("=").slice(1).join("=")) : undefined;
  const batchSize = batchArg
    ? Number(batchArg.split("=").slice(1).join("="))
    : 250;

  return {
    dryRun,
    limit: Number.isFinite(limit) ? limit : undefined,
    batchSize: Number.isFinite(batchSize) && batchSize > 0 ? batchSize : 250,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log("[backfill-product-url-slugs] starting", args);

  let updated = 0;
  let scanned = 0;
  let totalLimitRemaining = args.limit ?? Number.POSITIVE_INFINITY;

  /**
   * Prisma `where: { urlSlug: null }` does NOT reliably match Mongo docs where the field is missing.
   * For older products created before `urlSlug` existed, the field is absent.
   *
   * So we use Mongo raw commands with `$exists: false`.
   */
  const collectionName = "Product";

  while (totalLimitRemaining > 0) {
    const limitThisBatch = Math.min(args.batchSize, totalLimitRemaining);

    const findResult = (await db.$runCommandRaw({
      find: collectionName,
      filter: {
        $or: [{ urlSlug: { $exists: false } }, { urlSlug: null }, { urlSlug: "" }],
      },
      projection: { _id: 1, name: 1, urlSlug: 1 },
      limit: limitThisBatch,
      sort: { _id: 1 },
    })) as any;

    const docs: Array<{ _id: any; name?: string; urlSlug?: string | null }> =
      findResult?.cursor?.firstBatch ?? [];

    if (docs.length === 0) break;

    scanned += docs.length;

    for (const d of docs) {
      const name = typeof d.name === "string" && d.name.trim() !== "" ? d.name : "product";
      const nextSlug = slugifyOrDefault(name);

      const idStr =
        typeof d._id === "string"
          ? d._id
          : d?._id?.$oid
            ? String(d._id.$oid)
            : String(d._id);

      if (args.dryRun) {
        console.log(`[dry-run] ${idStr} "${name}" -> ${nextSlug}`);
      } else {
        await db.$runCommandRaw({
          update: collectionName,
          updates: [
            {
              q: { _id: d._id },
              u: { $set: { urlSlug: nextSlug } },
              upsert: false,
            },
          ],
        });
      }

      updated += 1;
      totalLimitRemaining -= 1;

      if (totalLimitRemaining <= 0) break;
    }
  }

  console.log("[backfill-product-url-slugs] done");
  console.log({ scanned, updated });
}

main()
  .catch((err) => {
    console.error("[backfill-product-url-slugs] failed", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    // Ensure the Node process can exit cleanly.
    await db.$disconnect().catch(() => {});
  });


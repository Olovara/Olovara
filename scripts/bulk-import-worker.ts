/**
 * Bulk Import Worker Script
 * Run this script to start processing bulk import jobs
 * Uses process.cwd() (project root) so no import.meta needed (avoids TS module restriction).
 *
 * Usage: yarn worker
 * Or: npx tsx scripts/bulk-import-worker.ts
 */
import path from "path";
import { pathToFileURL } from "url";

async function main() {
  const projectRoot = process.cwd();
  const workerPath = path.join(projectRoot, "lib", "workers", "bulk-import-worker.ts");
  const workerModule = await import(pathToFileURL(workerPath).href);
  const getBulkImportWorker = (workerModule as any).getBulkImportWorker;

  console.log("[BULK IMPORT WORKER] Starting worker...");

  const worker = getBulkImportWorker();

  process.on("SIGTERM", async () => {
    console.log("[BULK IMPORT WORKER] Received SIGTERM, shutting down gracefully...");
    await worker.close();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.log("[BULK IMPORT WORKER] Received SIGINT, shutting down gracefully...");
    await worker.close();
    process.exit(0);
  });

  console.log("[BULK IMPORT WORKER] Worker started and ready to process jobs");
}

main().catch((err) => {
  console.error("[BULK IMPORT WORKER] Failed to start:", err);
  process.exit(1);
});




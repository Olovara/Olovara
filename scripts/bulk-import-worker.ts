/**
 * Bulk Import Worker Script
 * Run this script to start processing bulk import jobs
 * 
 * Usage: yarn worker
 * Or: tsx scripts/bulk-import-worker.ts
 */

import { getBulkImportWorker } from "@/lib/workers/bulk-import-worker";

console.log("[BULK IMPORT WORKER] Starting worker...");

// Get and start the worker
const worker = getBulkImportWorker();

// Handle graceful shutdown
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




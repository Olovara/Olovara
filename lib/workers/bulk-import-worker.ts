/**
 * BullMQ worker for processing bulk import jobs
 * This should run in a separate worker process or serverless function
 * 
 * IMPORTANT: This worker processes jobs in batches of 50 rows
 * and handles failures gracefully (continues processing even if some rows fail)
 */

import { Worker, WorkerOptions, Job } from "bullmq";
import { getRedisClient } from "@/lib/redis";
import { processBulkImportBatch } from "@/lib/bulk-import/processor";
import Redis from "ioredis";
import { sanitizeRedisUrl } from "@/lib/utils/sanitize-redis-url";

// Worker name
export const BULK_IMPORT_WORKER_NAME = "bulk-import-worker";

// Singleton worker instance
let bulkImportWorker: Worker | null = null;

/**
 * Get or create the bulk import worker
 * CRITICAL: Only create ONE worker per process
 */
export function getBulkImportWorker(): Worker {
  if (!bulkImportWorker) {
    // Parse REDIS_URL if provided, otherwise use individual settings
    let connection: any;
    
    if (process.env.REDIS_URL) {
      // Parse Redis URL manually to handle special characters in passwords
      // Format: redis://username:password@host:port or rediss:// for TLS
      const redisUrlString = process.env.REDIS_URL;
      let redisInstance: Redis;
      
      // Parse Redis URL manually to handle special characters in passwords
      // Format: redis://username:password@host:port or rediss:// for TLS
      // Use regex to parse since URL constructor fails with special characters
      const urlMatch = redisUrlString.match(/^(rediss?):\/\/(?:([^:]+):([^@]+)@)?([^:\/]+)(?::(\d+))?(?:\/.*)?$/);
      
      if (!urlMatch) {
        throw new Error("Invalid Redis URL format");
      }
      
      const [, protocol, username, password, hostname, port] = urlMatch;
      const isTLS = protocol === "rediss";
      
      redisInstance = new Redis({
        host: hostname,
        port: port ? parseInt(port, 10) : 6379,
        username: username || undefined,
        password: password || undefined,
        ...(isTLS ? { tls: {} } : {}),
        maxRetriesPerRequest: null, // Required by BullMQ for blocking operations
        enableReadyCheck: true,
        lazyConnect: true,
      });
      
      // BullMQ accepts a Redis instance directly as connection
      bulkImportWorker = new Worker(
        "bulk-import",
        async (job: Job) => {
          console.log(`[BULK IMPORT WORKER] Processing job ${job.id}`);
          
          // Debug: Log the raw job data to see what BullMQ received
          console.log(`[BULK IMPORT WORKER] Raw job.data:`, JSON.stringify(job.data, null, 2));
          console.log(`[BULK IMPORT WORKER] Job data keys:`, Object.keys(job.data || {}));
          
          const { 
            jobId, 
            sellerId, 
            csvData, 
            mapping, 
            sourcePlatform, 
            mappingId,
            primaryCategory,
            secondaryCategory,
            tertiaryCategory,
            freeShipping,
            shippingOptionId,
            handlingFee,
          } = job.data;
          
          // Debug: Log destructured values
          console.log(`[BULK IMPORT WORKER] Destructured shipping data:`, {
            freeShipping,
            shippingOptionId,
            handlingFee,
          });

          // Process the import
          const result = await processBulkImportBatch({
            jobId,
            sellerId,
            csvData,
            mapping,
            sourcePlatform,
            mappingId,
            primaryCategory,
            secondaryCategory,
            tertiaryCategory,
            freeShipping,
            shippingOptionId,
            handlingFee,
          });

          return result;
        },
        {
          connection: redisInstance,
          concurrency: 1,
          limiter: {
            max: 1,
            duration: 1000,
          },
        }
      );

      // Event listeners
      bulkImportWorker.on("completed", (job) => {
        console.log(`[BULK IMPORT WORKER] Job ${job.id} completed`);
      });

      bulkImportWorker.on("failed", (job, error) => {
        console.error(`[BULK IMPORT WORKER] Job ${job?.id} failed:`, error);
      });

      bulkImportWorker.on("error", (error) => {
        // Sanitize any URLs in error messages
        const errorMessage = error instanceof Error ? error.message : String(error);
        const sanitizedMessage = errorMessage.replace(
          /redis:\/\/[^\s]+/g,
          (match) => sanitizeRedisUrl(match)
        );
        console.error("[BULK IMPORT WORKER] Worker error:", sanitizedMessage);
      });
      
      return bulkImportWorker;
    } else {
      // Use individual environment variables
      connection = {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379", 10),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: null, // Required by BullMQ for blocking operations
      };
    }

    const workerOptions: WorkerOptions = {
      connection,
      concurrency: 1, // Process one job at a time to avoid overwhelming the system
      limiter: {
        max: 1, // Max 1 job at a time
        duration: 1000, // Per second
      },
    };

    bulkImportWorker = new Worker(
      "bulk-import",
      async (job: Job) => {
        console.log(`[BULK IMPORT WORKER] Processing job ${job.id}`);
        
        const { 
          jobId, 
          sellerId, 
          csvData, 
          mapping, 
          sourcePlatform, 
          mappingId,
          primaryCategory,
          secondaryCategory,
          tertiaryCategory,
          freeShipping,
          shippingOptionId,
          handlingFee,
        } = job.data;

        // Process the import
        const result = await processBulkImportBatch({
          jobId,
          sellerId,
          csvData,
          mapping,
          sourcePlatform,
          mappingId,
          primaryCategory,
          secondaryCategory,
          tertiaryCategory,
          freeShipping,
          shippingOptionId,
          handlingFee,
        });

        return result;
      },
      workerOptions
    );

    // Event listeners
    bulkImportWorker.on("completed", (job) => {
      console.log(`[BULK IMPORT WORKER] Job ${job.id} completed`);
    });

    bulkImportWorker.on("failed", (job, error) => {
      console.error(`[BULK IMPORT WORKER] Job ${job?.id} failed:`, error);
    });

    bulkImportWorker.on("error", (error) => {
      console.error("[BULK IMPORT WORKER] Worker error:", error);
    });
  }

  return bulkImportWorker;
}

/**
 * Close worker (useful for cleanup/testing)
 */
export async function closeBulkImportWorker(): Promise<void> {
  if (bulkImportWorker) {
    await bulkImportWorker.close();
    bulkImportWorker = null;
    console.log("[BULK IMPORT WORKER] Worker closed");
  }
}


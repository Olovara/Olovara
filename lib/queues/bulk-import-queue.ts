/**
 * BullMQ queue for bulk import jobs
 * Processes CSV imports in the background
 */

import { Queue, QueueOptions } from "bullmq";
import { getRedisClient } from "@/lib/redis";
import Redis from "ioredis";
import { sanitizeRedisUrl } from "@/lib/utils/sanitize-redis-url";

// Queue name
export const BULK_IMPORT_QUEUE_NAME = "bulk-import";

// Singleton queue instance
let bulkImportQueue: Queue | null = null;
let queueError: Error | null = null;

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  try {
    const client = getRedisClient();
    return client.status === "ready" || client.status === "connect";
  } catch (error) {
    return false;
  }
}

/**
 * Get or create the bulk import queue
 * Uses singleton pattern to ensure one queue per process
 * Returns null if Redis is not available
 */
export function getBulkImportQueue(): Queue | null {
  // If we've already encountered an error, don't try again
  if (queueError) {
    return null;
  }

  if (!bulkImportQueue) {
    try {
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
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: true,
          retryStrategy: (times: number) => {
            if (times > 3) {
              return null;
            }
            return Math.min(times * 50, 2000);
          },
        });
        
        // BullMQ can accept a Redis instance directly as connection
        bulkImportQueue = new Queue(BULK_IMPORT_QUEUE_NAME, {
          connection: redisInstance,
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 2000,
            },
            removeOnComplete: {
              age: 1 * 1 * 3600,
              count: 50,
            },
            removeOnFail: {
              age: 1 * 24 * 3600,
            },
          },
        });
        
      // Event listeners
      bulkImportQueue.on("error", (error) => {
        // Sanitize any URLs in error messages
        const errorMessage = error instanceof Error ? error.message : String(error);
        const sanitizedMessage = errorMessage.replace(
          /redis:\/\/[^\s]+/g,
          (match) => sanitizeRedisUrl(match)
        );
        console.error("[BULK IMPORT QUEUE] Queue error:", sanitizedMessage);
        queueError = error instanceof Error ? new Error(sanitizedMessage) : new Error(sanitizedMessage);
      });
        
        return bulkImportQueue;
      } else {
        // Use individual environment variables
        connection = {
          host: process.env.REDIS_HOST || "localhost",
          port: parseInt(process.env.REDIS_PORT || "6379", 10),
          password: process.env.REDIS_PASSWORD,
          // Connection options
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: true, // Don't connect immediately
          retryStrategy: (times: number) => {
            if (times > 3) {
              // Stop retrying after 3 attempts
              return null;
            }
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        };
      }

      const queueOptions: QueueOptions = {
        connection,
        defaultJobOptions: {
          // Retry failed jobs up to 3 times
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000, // Start with 2 seconds, exponential backoff
          },
          // Remove completed jobs after 1 minute
          removeOnComplete: {
            age: 1 * 1 * 3600, // 1 minute in seconds
            count: 50, // Keep last 50 completed jobs
          },
          // Remove failed jobs after 1 day
          removeOnFail: {
            age: 1 * 24 * 3600, // 1 day in seconds
          },
        },
      };

      bulkImportQueue = new Queue(BULK_IMPORT_QUEUE_NAME, queueOptions);

      // Event listeners for monitoring
      bulkImportQueue.on("error", (error) => {
        console.error("[BULK IMPORT QUEUE] Queue error:", error);
        queueError = error instanceof Error ? error : new Error(String(error));
      });
      
      // Note: Queue connection status is managed by the underlying Redis client
      // Successful job operations will clear the queueError automatically
    } catch (error) {
      // Sanitize any URLs in error messages
      const errorMessage = error instanceof Error ? error.message : String(error);
      const sanitizedMessage = errorMessage.replace(
        /redis:\/\/[^\s]+/g,
        (match) => sanitizeRedisUrl(match)
      );
      console.error("[BULK IMPORT QUEUE] Failed to create queue:", sanitizedMessage);
      queueError = error instanceof Error ? new Error(sanitizedMessage) : new Error(sanitizedMessage);
      return null;
    }
  }

  return bulkImportQueue;
}

/**
 * Add a bulk import job to the queue
 * Throws an error if Redis is not available
 */
export async function addBulkImportJob(data: {
  jobId: string;
  sellerId: string;
  csvData: any[]; // Parsed CSV rows
  mapping: Record<string, string>; // CSV header -> product field mapping
  sourcePlatform?: string;
  mappingId?: string;
  primaryCategory?: string;
  secondaryCategory?: string;
  tertiaryCategory?: string;
  freeShipping?: boolean;
  shippingOptionId?: string;
  handlingFee?: number;
}): Promise<void> {
  const queue = getBulkImportQueue();
  
  if (!queue) {
    throw new Error(
      "Redis is not available. Please ensure Redis is running or configure REDIS_URL environment variable."
    );
  }
  
  try {
    await queue.add("process-import", data, {
      jobId: data.jobId, // Use custom job ID for tracking
      priority: 1, // Normal priority
    });
    // Clear error on successful job addition (indicates connection is working)
    queueError = null;
  } catch (error) {
    // If connection fails, throw a more helpful error
    if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
      throw new Error(
        "Cannot connect to Redis. Please ensure Redis is running on localhost:6379 or configure REDIS_URL."
      );
    }
    throw error;
  }
}

/**
 * Get job status
 * Returns null if Redis is not available or job not found
 */
export async function getJobStatus(jobId: string) {
  const queue = getBulkImportQueue();
  
  if (!queue) {
    return null;
  }
  
  try {
    const job = await queue.getJob(jobId);
    
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
      state: await job.getState(),
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  } catch (error) {
    console.error("[BULK IMPORT QUEUE] Error getting job status:", error);
    return null;
  }
}

/**
 * Close queue connection (useful for cleanup/testing)
 */
export async function closeBulkImportQueue(): Promise<void> {
  if (bulkImportQueue) {
    await bulkImportQueue.close();
    bulkImportQueue = null;
  }
}


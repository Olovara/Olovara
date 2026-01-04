/**
 * Redis connection manager
 * CRITICAL: Reuse ONE Redis connection per app process
 * ONE per worker process
 * Do NOT open new connections per request
 */

import Redis from "ioredis";
import { sanitizeRedisUrl } from "@/lib/utils/sanitize-redis-url";

// Singleton Redis connection instance
let redisClient: Redis | null = null;

/**
 * Get or create Redis connection
 * Returns singleton instance to ensure one connection per process
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;
    
    const connectionOptions: any = {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      // Connection pool settings
      lazyConnect: true, // Don't connect immediately - wait until first use
      // Retry strategy - stop retrying after 3 attempts to avoid spam
      retryStrategy: (times: number) => {
        if (times > 3) {
          // Stop retrying after 3 attempts
          console.warn("[REDIS] Max retry attempts reached. Redis may not be available.");
          return null;
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    };

    // Use REDIS_URL if provided, otherwise use host/port
    if (redisUrl) {
      // Check if URL uses TLS (rediss://)
      // Note: Some cloud Redis providers require TLS even with redis://
      // If connection fails, try changing redis:// to rediss:// in your REDIS_URL
      const urlObj = new URL(redisUrl);
      const isTLS = urlObj.protocol === "rediss:";
      
      // Add TLS options if protocol explicitly uses TLS
      if (isTLS) {
        connectionOptions.tls = {};
      }
      
      redisClient = new Redis(redisUrl, connectionOptions);
    } else {
      redisClient = new Redis({
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379", 10),
        password: process.env.REDIS_PASSWORD,
        ...connectionOptions,
      });
    }

    // Error handling
    redisClient.on("error", (error) => {
      // Only log errors, don't throw - let the application continue
      // Sanitize any URLs in error messages
      const errorMessage = error instanceof Error ? error.message : String(error);
      const sanitizedMessage = errorMessage.replace(
        /redis:\/\/[^\s]+/g,
        (match) => sanitizeRedisUrl(match)
      );
      console.error("[REDIS] Connection error:", sanitizedMessage);
    });

    redisClient.on("connect", () => {
      console.log("[REDIS] Connected to Redis");
    });

    redisClient.on("ready", () => {
      console.log("[REDIS] Redis client ready");
    });

    redisClient.on("close", () => {
      console.log("[REDIS] Connection closed");
    });

    redisClient.on("reconnecting", () => {
      console.log("[REDIS] Reconnecting to Redis...");
    });
  }

  return redisClient;
}

/**
 * Close Redis connection (useful for cleanup/testing)
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}


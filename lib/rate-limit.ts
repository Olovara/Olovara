import { NextResponse } from "next/server";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export const rateLimit = (
  identifier: string,
  limit: number = 5,
  windowMs: number = 60 * 1000 // 1 minute
) => {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Clean up old entries
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < windowStart) {
      delete store[key];
    }
  });

  // Initialize or get current count
  if (!store[identifier]) {
    store[identifier] = {
      count: 0,
      resetTime: now + windowMs,
    };
  }

  // Increment count
  store[identifier].count++;

  // Check if rate limit exceeded
  if (store[identifier].count > limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: store[identifier].resetTime,
    };
  }

  return {
    success: true,
    limit,
    remaining: limit - store[identifier].count,
    reset: store[identifier].resetTime,
  };
}; 
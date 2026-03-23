/**
 * Shared currency conversion (rates cache, DB, FreeCurrencyAPI).
 * Used by POST /api/currency/convert and by server routes (e.g. create-payment-intent) without an HTTP self-call.
 */
import { SUPPORTED_CURRENCIES } from "@/data/units";
import { db } from "@/lib/db";

// Simple in-memory rate limiter
class RateLimiter {
  private requests: number[] = [];
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove requests older than the window
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    if (this.requests.length >= this.limit) {
      return false;
    }

    this.requests.push(now);
    return true;
  }

  getTimeUntilNextRequest(): number {
    if (this.requests.length < this.limit) {
      return 0;
    }
    const oldestRequest = this.requests[0];
    return Math.max(0, oldestRequest + this.windowMs - Date.now());
  }
}

// In-memory cache for exchange rates with TTL
class ExchangeRateCache {
  private cache: Map<
    string,
    { rates: Record<string, number>; timestamp: number }
  > = new Map();
  private readonly ttl: number; // Time to live in milliseconds

  constructor(ttl: number = 60 * 60 * 1000) {
    // Default 1 hour
    this.ttl = ttl;
  }

  // Get cached rates for a base currency
  get(baseCurrency: string): Record<string, number> | null {
    const key = baseCurrency.toLowerCase();
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if cache is still valid
    const now = Date.now();
    if (now - cached.timestamp > this.ttl) {
      // Cache expired, remove it
      this.cache.delete(key);
      return null;
    }

    return cached.rates;
  }

  // Set rates in cache
  set(baseCurrency: string, rates: Record<string, number>): void {
    const key = baseCurrency.toLowerCase();
    this.cache.set(key, {
      rates,
      timestamp: Date.now(),
    });
  }

  // Clear cache for a specific base currency
  clear(baseCurrency: string): void {
    const key = baseCurrency.toLowerCase();
    this.cache.delete(key);
  }

  // Clear all cache
  clearAll(): void {
    this.cache.clear();
  }
}

// Create a rate limiter instance (8 requests per minute)
const rateLimiter = new RateLimiter(8, 60 * 1000);

// Create in-memory cache for exchange rates (1 hour TTL)
const exchangeRateCache = new ExchangeRateCache(60 * 60 * 1000);

// Mutex/lock mechanism to prevent concurrent updates for the same base currency
// This prevents write conflicts when multiple requests try to update rates simultaneously
class CurrencyUpdateLock {
  private locks: Map<string, Promise<void>> = new Map();

  // Acquire lock for a base currency - returns a promise that resolves when lock is available
  async acquire(baseCurrency: string): Promise<() => void> {
    const key = baseCurrency.toLowerCase();
    
    // Wait for any existing lock to complete
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }

    // Create new lock promise
    let releaseLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    this.locks.set(key, lockPromise);

    // Return release function
    return () => {
      this.locks.delete(key);
      releaseLock();
    };
  }
}

const currencyUpdateLock = new CurrencyUpdateLock();

// Get exchange rates from FreeCurrencyAPI
async function getExchangeRatesFromAPI(baseCurrency: string) {
  try {
    // Check rate limit before making request
    if (!rateLimiter.canMakeRequest()) {
      const waitTime = rateLimiter.getTimeUntilNextRequest();
      throw new Error(
        `Rate limit exceeded. Please try again in ${Math.ceil(waitTime / 1000)} seconds.`
      );
    }

    const response = await fetch(
      `https://api.freecurrencyapi.com/v1/latest?base_currency=${baseCurrency.toUpperCase()}&apikey=${process.env.FREE_CURRENCY_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch exchange rates from FreeCurrencyAPI for ${baseCurrency}`
      );
    }

    const data = await response.json();

    if (!data.data || typeof data.data !== "object") {
      throw new Error("Invalid response format from FreeCurrencyAPI");
    }

    // Convert rates to lowercase keys for consistency and filter for supported currencies
    const rates: Record<string, number> = {};
    Object.entries(data.data).forEach(([currency, rate]) => {
      const currencyCode = currency.toUpperCase();
      if (SUPPORTED_CURRENCIES.some((c) => c.code === currencyCode)) {
        rates[currency.toLowerCase()] = rate as number;
      }
    });

    // Add base currency rate (1:1)
    rates[baseCurrency.toLowerCase()] = 1;

    return rates;
  } catch (error) {
    console.error("Error fetching exchange rates from FreeCurrencyAPI:", error);
    throw error;
  }
}

// Helper function to retry operations
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      if (error.code === "P2034") {
        // Transaction conflict
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

// Get exchange rates from cache, database, or fetch new ones
async function getExchangeRates(baseCurrency: string, forceRefresh: boolean = false) {
  try {
    const normalizedBase = baseCurrency.toLowerCase();

    // First, check in-memory cache (fastest) - skip if forcing refresh
    if (!forceRefresh) {
      const cachedRates = exchangeRateCache.get(normalizedBase);
      if (cachedRates) {
        return cachedRates;
      }
    } else {
      // Clear cache if forcing refresh
      exchangeRateCache.clear(normalizedBase);
    }

    // Second, check database for recent rates (within last hour)
    const recentRates = await db.exchangeRate.findMany({
      where: {
        baseCurrency: baseCurrency.toUpperCase(),
        targetCurrency: {
          in: SUPPORTED_CURRENCIES.map((c) => c.code),
        },
        lastUpdated: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last 1 hour
        },
        isActive: true,
      },
    });

    // Create a map of existing recent rates
    const existingRates: Record<string, number> = {};
    recentRates.forEach((rate) => {
      existingRates[rate.targetCurrency.toLowerCase()] = rate.rate;
    });

    // Check if we have all the rates we need and they're fresh
    const missingCurrencies = SUPPORTED_CURRENCIES.filter(
      (currency) => !existingRates[currency.code.toLowerCase()]
    );

    // If we have all fresh rates from database and not forcing refresh, cache them and return
    if (missingCurrencies.length === 0 && !forceRefresh) {
      exchangeRateCache.set(normalizedBase, existingRates);
      return existingRates;
    }

    // If rates are missing OR stale (older than 1 hour) OR forcing refresh, fetch new ones
    // First, get all existing rates (even old ones) as fallback
    const allRates = await db.exchangeRate.findMany({
      where: {
        baseCurrency: baseCurrency.toUpperCase(),
        targetCurrency: {
          in: SUPPORTED_CURRENCIES.map((c) => c.code),
        },
        isActive: true,
      },
    });

    const fallbackRates: Record<string, number> = {};
    allRates.forEach((rate) => {
      fallbackRates[rate.targetCurrency.toLowerCase()] = rate.rate;
    });

    // Fetch new rates from API
    let newRates: Record<string, number>;
    try {
      newRates = await getExchangeRatesFromAPI(baseCurrency);
    } catch (error) {
      console.error("Failed to get rates from FreeCurrencyAPI:", error);
      // If API fails but we have fallback rates (even if old), return what we have
      if (Object.keys(fallbackRates).length > 0) {
        console.warn(`Using fallback rates for ${baseCurrency} (may be stale)`);
        return fallbackRates;
      }
      throw error;
    }

    // Acquire lock for this base currency to prevent concurrent updates
    // This prevents write conflicts when multiple requests try to update simultaneously
    const releaseLock = await currencyUpdateLock.acquire(baseCurrency);
    
    try {
      // Double-check cache after acquiring lock - another request might have updated it
      const cachedAfterLock = exchangeRateCache.get(normalizedBase);
      if (cachedAfterLock && !forceRefresh) {
        releaseLock();
        return cachedAfterLock;
      }

      // Update database with new rates using retry logic
      await retryOperation(
        async () => {
          // Use a transaction to ensure all updates succeed or fail together
          await db.$transaction(
            async (tx) => {
              await Promise.all(
                Object.entries(newRates)
                  .filter(([currency]) =>
                    SUPPORTED_CURRENCIES.some(
                      (c) => c.code === currency.toUpperCase()
                    )
                  )
                  .map(([currency, rate]) =>
                    tx.exchangeRate.upsert({
                      where: {
                        baseCurrency_targetCurrency: {
                          baseCurrency: baseCurrency.toUpperCase(),
                          targetCurrency: currency.toUpperCase(),
                        },
                      },
                      update: {
                        rate,
                        lastUpdated: new Date(),
                        isActive: true,
                      },
                      create: {
                        baseCurrency: baseCurrency.toUpperCase(),
                        targetCurrency: currency.toUpperCase(),
                        rate,
                        lastUpdated: new Date(),
                        isActive: true,
                      },
                    })
                  )
              );
            },
            {
              maxWait: 10000, // 10 seconds
              timeout: 15000, // 15 seconds
            }
          );
        },
        5,
        1000
      ); // Increase retries to 5 and delay to 1 second

      // Use new rates (they're fresh from API)
      // Cache the new rates in memory
      exchangeRateCache.set(normalizedBase, newRates);
      
      return newRates;
    } finally {
      // Always release the lock, even if there's an error
      releaseLock();
    }
  } catch (error) {
    console.error("Error in getExchangeRates:", error);
    throw error;
  }
}

// Convert price from one currency to another
async function convertPrice(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  isCents: boolean = false
): Promise<number> {
  try {
    // Normalize currencies to lowercase
    fromCurrency = fromCurrency.toLowerCase();
    toCurrency = toCurrency.toLowerCase();

    // If currencies are the same, return the amount
    if (fromCurrency === toCurrency) {
      return isCents ? amount : amount * 100;
    }

    // Convert from cents to dollars if needed
    const amountInDollars = isCents ? amount / 100 : amount;

    // Get exchange rates using the source currency as base
    const rates = await getExchangeRates(fromCurrency);

    // Convert directly using the rate
    const rate = rates[toCurrency];
    if (!rate) {
      throw new Error(`No exchange rate found for ${toCurrency}`);
    }

    // Convert using the rate (multiply since rates are now relative to source currency)
    const finalAmount = amountInDollars * rate;

    // Always return in cents if the input was in cents
    return isCents ? Math.round(finalAmount * 100) : finalAmount;
  } catch (error) {
    console.error("Error converting price:", error);
    throw error;
  }
}

// Batch convert multiple prices efficiently
async function batchConvertPrices(
  conversions: Array<{
    amount: number;
    fromCurrency: string;
    toCurrency: string;
    isCents?: boolean;
  }>
): Promise<number[]> {
  try {
    // Group conversions by fromCurrency to minimize API calls
    // Since all products on a page use the same toCurrency, we can optimize further
    const currencyGroups = new Map<
      string,
      Array<{
        amount: number;
        toCurrency: string;
        isCents?: boolean;
        index: number;
      }>
    >();

    conversions.forEach((conv, index) => {
      const fromCurrency = conv.fromCurrency.toLowerCase();
      if (!currencyGroups.has(fromCurrency)) {
        currencyGroups.set(fromCurrency, []);
      }
      currencyGroups.get(fromCurrency)!.push({
        amount: conv.amount,
        toCurrency: conv.toCurrency.toLowerCase(),
        isCents: conv.isCents ?? false,
        index,
      });
    });

    // Fetch exchange rates for all unique base currencies in parallel
    const baseCurrencies = Array.from(currencyGroups.keys());
    const ratesMap = new Map<string, Record<string, number>>();

    await Promise.all(
      baseCurrencies.map(async (baseCurrency) => {
        const rates = await getExchangeRates(baseCurrency);
        ratesMap.set(baseCurrency, rates);
      })
    );

    // Convert all prices using cached rates
    const results = new Array(conversions.length);

    currencyGroups.forEach((convs, fromCurrency) => {
      const rates = ratesMap.get(fromCurrency)!;

      convs.forEach(({ amount, toCurrency, isCents, index }) => {
        // If currencies are the same, return the amount
        if (fromCurrency === toCurrency) {
          results[index] = isCents ? amount : amount * 100;
          return;
        }

        // Convert from cents to dollars if needed
        const amountInDollars = isCents ? amount / 100 : amount;

        // Get the exchange rate
        const rate = rates[toCurrency];
        if (!rate) {
          throw new Error(`No exchange rate found for ${toCurrency}`);
        }

        // Convert using the rate
        const finalAmount = amountInDollars * rate;
        results[index] = isCents ? Math.round(finalAmount * 100) : finalAmount;
      });
    });

    return results;
  } catch (error) {
    console.error("Error in batch conversion:", error);
    throw error;
  }
}

/** Single amount conversion — same behavior as POST /api/currency/convert (non-batch). */
export async function convertCurrencyAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  isCents = false,
): Promise<number> {
  return convertPrice(amount, fromCurrency, toCurrency, isCents);
}

/** Batch conversion — same behavior as POST /api/currency/convert with `conversions` array. */
export async function batchConvertCurrencyAmounts(
  conversions: Array<{
    amount: number;
    fromCurrency: string;
    toCurrency: string;
    isCents?: boolean;
  }>,
): Promise<number[]> {
  return batchConvertPrices(conversions);
}

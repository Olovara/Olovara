import { NextResponse } from "next/server";
import { SUPPORTED_CURRENCIES } from "@/data/units";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";

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
async function getExchangeRates(baseCurrency: string) {
  try {
    const normalizedBase = baseCurrency.toLowerCase();

    // First, check in-memory cache (fastest)
    const cachedRates = exchangeRateCache.get(normalizedBase);
    if (cachedRates) {
      return cachedRates;
    }

    // Second, check database (within last hour)
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

    // Create a map of existing rates
    const existingRates: Record<string, number> = {};
    recentRates.forEach((rate) => {
      existingRates[rate.targetCurrency.toLowerCase()] = rate.rate;
    });

    // Check if we have all the rates we need
    const missingCurrencies = SUPPORTED_CURRENCIES.filter(
      (currency) => !existingRates[currency.code.toLowerCase()]
    );

    // If we have all rates from database, cache them and return
    if (missingCurrencies.length === 0) {
      exchangeRateCache.set(normalizedBase, existingRates);
      return existingRates;
    }

    // If we have some rates but not all, fetch new ones from API
    let newRates: Record<string, number>;
    try {
      newRates = await getExchangeRatesFromAPI(baseCurrency);
    } catch (error) {
      console.error("Failed to get rates from FreeCurrencyAPI:", error);
      // If API fails but we have some rates, return what we have
      if (Object.keys(existingRates).length > 0) {
        return existingRates;
      }
      throw error;
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

    // Combine existing and new rates
    const combinedRates = {
      ...existingRates,
      ...newRates,
    };

    // Cache the combined rates in memory
    exchangeRateCache.set(normalizedBase, combinedRates);

    return combinedRates;
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

export async function POST(req: Request) {
  // Declare variables outside try block so they're accessible in catch
  let body: any = null;

  try {
    body = await req.json();

    // Check if this is a batch request
    if (Array.isArray(body.conversions)) {
      // Batch conversion request
      const { conversions } = body;

      if (!conversions || conversions.length === 0) {
        return NextResponse.json(
          { error: "Missing or empty conversions array" },
          { status: 400 }
        );
      }

      // Validate all conversions
      const supportedCurrencies = SUPPORTED_CURRENCIES.map((c) =>
        c.code.toLowerCase()
      );
      for (const conv of conversions) {
        if (!conv.amount || !conv.fromCurrency || !conv.toCurrency) {
          return NextResponse.json(
            { error: "Missing required parameters in conversion" },
            { status: 400 }
          );
        }

        if (
          !supportedCurrencies.includes(conv.fromCurrency.toLowerCase()) ||
          !supportedCurrencies.includes(conv.toCurrency.toLowerCase())
        ) {
          return NextResponse.json(
            {
              error: `Unsupported currency in conversion: ${conv.fromCurrency} -> ${conv.toCurrency}`,
            },
            { status: 400 }
          );
        }
      }

      const convertedAmounts = await batchConvertPrices(conversions);
      return NextResponse.json({ convertedAmounts });
    } else {
      // Single conversion request (backward compatible)
      const { amount, fromCurrency, toCurrency, isCents } = body;

      if (!amount || !fromCurrency || !toCurrency) {
        return NextResponse.json(
          { error: "Missing required parameters" },
          { status: 400 }
        );
      }

      // Validate currencies
      const supportedCurrencies = SUPPORTED_CURRENCIES.map((c) =>
        c.code.toLowerCase()
      );
      if (
        !supportedCurrencies.includes(fromCurrency.toLowerCase()) ||
        !supportedCurrencies.includes(toCurrency.toLowerCase())
      ) {
        return NextResponse.json(
          { error: "Unsupported currency" },
          { status: 400 }
        );
      }

      const convertedAmount = await convertPrice(
        amount,
        fromCurrency,
        toCurrency,
        isCents
      );

      return NextResponse.json({ convertedAmount });
    }
  } catch (error) {
    // Log to console (always happens)
    console.error("Error in currency conversion API:", error);

    // Don't log validation errors - they're expected client-side issues

    // Log to database - user could email about "currency conversion not working"
    const userMessage = logError({
      code: "CURRENCY_CONVERT_FAILED",
      userId: undefined, // Public route
      route: "/api/currency/convert",
      method: "POST",
      error,
      metadata: {
        isBatch: Array.isArray(body?.conversions),
        note: "Failed to convert currency",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

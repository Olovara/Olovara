import { NextResponse } from "next/server";
import { SUPPORTED_CURRENCIES } from "@/data/units";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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
    this.requests = this.requests.filter((time) => now - time < this.windowMs);
    if (this.requests.length >= this.limit) {
      return false;
    }
    this.requests.push(now);
    return true;
  }
}

// Create a rate limiter instance (8 requests per minute)
const rateLimiter = new RateLimiter(8, 60 * 1000);

// Get exchange rates from FreeCurrencyAPI
async function getExchangeRatesFromAPI(baseCurrency: string) {
  try {
    if (!rateLimiter.canMakeRequest()) {
      throw new Error("Rate limit exceeded. Please try again later.");
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

    // Convert rates to lowercase keys and filter for supported currencies
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
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

// Force refresh exchange rates for a base currency
async function refreshExchangeRates(baseCurrency: string) {
  try {
    // Fetch new rates from API
    const newRates = await getExchangeRatesFromAPI(baseCurrency);

    // Update database with new rates using retry logic
    await retryOperation(
      async () => {
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
            maxWait: 10000,
            timeout: 15000,
          }
        );
      },
      5,
      1000
    );

    return newRates;
  } catch (error) {
    console.error("Error refreshing exchange rates:", error);
    throw error;
  }
}

// POST endpoint to force refresh exchange rates
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { baseCurrency = "USD" } = body;

    // Validate base currency
    const supportedCurrencies = SUPPORTED_CURRENCIES.map((c) =>
      c.code.toLowerCase()
    );
    if (!supportedCurrencies.includes(baseCurrency.toLowerCase())) {
      return NextResponse.json(
        { error: `Unsupported base currency: ${baseCurrency}` },
        { status: 400 }
      );
    }

    // Refresh rates
    const rates = await refreshExchangeRates(baseCurrency.toLowerCase());

    return NextResponse.json({
      success: true,
      baseCurrency: baseCurrency.toUpperCase(),
      ratesCount: Object.keys(rates).length,
      message: `Successfully refreshed ${Object.keys(rates).length} exchange rates for ${baseCurrency.toUpperCase()}`,
    });
  } catch (error) {
    console.error("Error in currency refresh API:", error);

    const userMessage = logError({
      code: "CURRENCY_REFRESH_FAILED",
      userId: undefined,
      route: "/api/currency/refresh",
      method: "POST",
      error,
      metadata: {
        note: "Failed to refresh currency exchange rates",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

// GET endpoint to check current rates status
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const baseCurrency = searchParams.get("baseCurrency") || "USD";

    // Get all rates for this base currency
    const rates = await db.exchangeRate.findMany({
      where: {
        baseCurrency: baseCurrency.toUpperCase(),
        isActive: true,
      },
      orderBy: {
        lastUpdated: "desc",
      },
    });

    // Group by freshness
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const fresh = rates.filter(
      (r) => r.lastUpdated.getTime() >= oneHourAgo
    );
    const stale = rates.filter(
      (r) =>
        r.lastUpdated.getTime() < oneHourAgo &&
        r.lastUpdated.getTime() >= oneDayAgo
    );
    const veryStale = rates.filter((r) => r.lastUpdated.getTime() < oneDayAgo);

    return NextResponse.json({
      baseCurrency: baseCurrency.toUpperCase(),
      totalRates: rates.length,
      fresh: fresh.length,
      stale: stale.length,
      veryStale: veryStale.length,
      oldestUpdate: rates.length > 0 ? rates[rates.length - 1].lastUpdated : null,
      newestUpdate: rates.length > 0 ? rates[0].lastUpdated : null,
    });
  } catch (error) {
    console.error("Error checking currency rates status:", error);
    return NextResponse.json(
      { error: "Failed to check rates status" },
      { status: 500 }
    );
  }
}


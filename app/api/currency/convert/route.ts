import { NextResponse } from 'next/server';
import { SUPPORTED_CURRENCIES } from '@/data/units';
import { db } from '@/lib/db';

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
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
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

// Create a rate limiter instance (8 requests per minute)
const rateLimiter = new RateLimiter(8, 60 * 1000);

// Get exchange rates from FreeCurrencyAPI
async function getExchangeRatesFromAPI(baseCurrency: string) {
  try {
    // Check rate limit before making request
    if (!rateLimiter.canMakeRequest()) {
      const waitTime = rateLimiter.getTimeUntilNextRequest();
      throw new Error(`Rate limit exceeded. Please try again in ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    const response = await fetch(
      `https://api.freecurrencyapi.com/v1/latest?base_currency=${baseCurrency.toUpperCase()}&apikey=${process.env.FREE_CURRENCY_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates from FreeCurrencyAPI for ${baseCurrency}`);
    }
    
    const data = await response.json();
    
    if (!data.data || typeof data.data !== 'object') {
      throw new Error('Invalid response format from FreeCurrencyAPI');
    }

    // Convert rates to lowercase keys for consistency and filter for supported currencies
    const rates: Record<string, number> = {};
    Object.entries(data.data).forEach(([currency, rate]) => {
      const currencyCode = currency.toUpperCase();
      if (SUPPORTED_CURRENCIES.some(c => c.code === currencyCode)) {
        rates[currency.toLowerCase()] = rate as number;
      }
    });

    // Add base currency rate (1:1)
    rates[baseCurrency.toLowerCase()] = 1;

    return rates;
  } catch (error) {
    console.error('Error fetching exchange rates from FreeCurrencyAPI:', error);
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
      if (error.code === 'P2034') { // Transaction conflict
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

// Get exchange rates from database or fetch new ones
async function getExchangeRates(baseCurrency: string) {
  try {
    // Check if we have recent rates in the database (within last hour)
    const recentRates = await db.exchangeRate.findMany({
      where: {
        baseCurrency: baseCurrency.toUpperCase(),
        targetCurrency: {
          in: SUPPORTED_CURRENCIES.map(c => c.code)
        },
        lastUpdated: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last 1 hour
        },
        isActive: true
      }
    });

    // Create a map of existing rates
    const existingRates: Record<string, number> = {};
    recentRates.forEach(rate => {
      existingRates[rate.targetCurrency.toLowerCase()] = rate.rate;
    });

    // Check if we have all the rates we need
    const missingCurrencies = SUPPORTED_CURRENCIES.filter(
      currency => !existingRates[currency.code.toLowerCase()]
    );

    // If we have all rates, return them
    if (missingCurrencies.length === 0) {
      return existingRates;
    }

    // If we have some rates but not all, we'll update the missing ones
    let newRates: Record<string, number>;
    try {
      newRates = await getExchangeRatesFromAPI(baseCurrency);
    } catch (error) {
      console.error('Failed to get rates from FreeCurrencyAPI:', error);
      throw error;
    }

    // Update database with new rates using retry logic
    await retryOperation(async () => {
      // Use a transaction to ensure all updates succeed or fail together
      await db.$transaction(async (tx) => {
        await Promise.all(
          Object.entries(newRates)
            .filter(([currency]) => SUPPORTED_CURRENCIES.some(c => c.code === currency.toUpperCase()))
            .map(([currency, rate]) => 
              tx.exchangeRate.upsert({
                where: {
                  baseCurrency_targetCurrency: {
                    baseCurrency: baseCurrency.toUpperCase(),
                    targetCurrency: currency.toUpperCase()
                  }
                },
                update: {
                  rate,
                  lastUpdated: new Date(),
                  isActive: true
                },
                create: {
                  baseCurrency: baseCurrency.toUpperCase(),
                  targetCurrency: currency.toUpperCase(),
                  rate,
                  lastUpdated: new Date(),
                  isActive: true
                }
              })
            )
        );
      }, {
        maxWait: 10000, // 10 seconds
        timeout: 15000 // 15 seconds
      });
    }, 5, 1000); // Increase retries to 5 and delay to 1 second

    // Return combined rates (existing + new)
    return {
      ...existingRates,
      ...newRates
    };
  } catch (error) {
    console.error('Error in getExchangeRates:', error);
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

export async function POST(req: Request) {
  try {
    const { amount, fromCurrency, toCurrency, isCents } = await req.json();

    if (!amount || !fromCurrency || !toCurrency) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Validate currencies
    const supportedCurrencies = SUPPORTED_CURRENCIES.map(c => c.code.toLowerCase());
    if (!supportedCurrencies.includes(fromCurrency.toLowerCase()) || 
        !supportedCurrencies.includes(toCurrency.toLowerCase())) {
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
  } catch (error) {
    console.error("Error in currency conversion API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to convert currency" },
      { status: 500 }
    );
  }
} 
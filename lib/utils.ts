import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { stripeSecret } from "./stripe";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Cache exchange rates for 1 hour
let exchangeRatesCache: {
  rates: Record<string, number>;
  timestamp: number;
  lastError?: Error;
} | null = null;

// Get exchange rates from Stripe
async function getExchangeRates() {
  const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
  const RETRY_AFTER_ERROR = 5 * 60 * 1000; // 5 minutes after an error

  // Return cached rates if they're less than 1 hour old
  if (
    exchangeRatesCache &&
    Date.now() - exchangeRatesCache.timestamp < CACHE_DURATION
  ) {
    return exchangeRatesCache.rates;
  }

  // If we have a cached error, only retry after 5 minutes
  if (
    exchangeRatesCache?.lastError &&
    Date.now() - exchangeRatesCache.timestamp < RETRY_AFTER_ERROR
  ) {
    throw exchangeRatesCache.lastError;
  }

  try {
    console.log("Fetching exchange rates from Stripe...");
    const rates = await stripeSecret.instance.exchangeRates.retrieve("usd");
    console.log("Received exchange rates:", rates.rates);
    
    // Validate the rates
    if (!rates.rates || Object.keys(rates.rates).length === 0) {
      throw new Error("No exchange rates received from Stripe");
    }

    // Ensure we have rates for common currencies
    const requiredCurrencies = ["eur", "gbp", "cad", "aud", "jpy", "inr", "sgd"];
    const missingCurrencies = requiredCurrencies.filter(
      currency => !rates.rates[currency]
    );
    
    if (missingCurrencies.length > 0) {
      console.warn("Missing exchange rates for currencies:", missingCurrencies);
    }

    exchangeRatesCache = {
      rates: rates.rates,
      timestamp: Date.now(),
      lastError: undefined,
    };
    return rates.rates;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    // Cache the error to prevent rapid retries
    exchangeRatesCache = {
      rates: exchangeRatesCache?.rates || {}, // Keep old rates if available
      timestamp: Date.now(),
      lastError: error as Error,
    };
    throw error;
  }
}

// Convert price from one currency to another
export async function convertPrice(
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
      return amount;
    }

    // Convert from cents to dollars if needed
    const amountInDollars = isCents ? amount / 100 : amount;

    // Get exchange rates
    const rates = await getExchangeRates();
    console.log("Exchange rates:", rates);

    // Convert from source currency to USD
    let amountInUSD: number;
    if (fromCurrency === "usd") {
      amountInUSD = amountInDollars;
    } else {
      const fromRate = rates[fromCurrency];
      if (!fromRate) {
        throw new Error(`No exchange rate found for ${fromCurrency}`);
      }
      // Convert to USD by dividing by the rate
      amountInUSD = amountInDollars / fromRate;
    }

    // Convert from USD to target currency
    let finalAmount: number;
    if (toCurrency === "usd") {
      finalAmount = amountInUSD;
    } else {
      const toRate = rates[toCurrency];
      if (!toRate) {
        throw new Error(`No exchange rate found for ${toCurrency}`);
      }
      // Convert from USD by multiplying by the rate
      finalAmount = amountInUSD * toRate;
    }

    console.log(`Converting ${amountInDollars} ${fromCurrency} to ${toCurrency}:`, {
      amountInUSD,
      finalAmount,
      fromRate: rates[fromCurrency],
      toRate: rates[toCurrency]
    });

    // Return in cents if needed
    return isCents ? Math.round(finalAmount * 100) : finalAmount;
  } catch (error) {
    console.error("Error converting price:", error);
    return amount; // Return original amount if conversion fails
  }
}

export function formatPrice(
  price: number | string,
  options: {
    currency?: "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "INR" | "SGD";
    notation?: Intl.NumberFormatOptions["notation"];
    isCents?: boolean;
  } = {}
) {
  const { currency = "USD", notation = "compact", isCents = true } = options;

  const numericPrice = typeof price === "string" ? parseFloat(price) : price;

  // Convert cents to dollars if isCents is true
  const priceInDollars = isCents ? numericPrice / 100 : numericPrice;

  // Get the number of decimal places for the currency
  const decimals = currency === "JPY" ? 0 : 2;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation,
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(priceInDollars);
}

export function shopNameSlugify(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "") // Remove spaces
    .replace(/[^\w-]+/g, ""); // Remove special characters
}

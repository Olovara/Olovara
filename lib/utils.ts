import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { stripeSecret } from "./stripe";
import { getCurrencySymbol } from "@/data/units";

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

/**
 * Format a price in the product's original currency (no conversion)
 * @param price - Price in cents
 * @param currency - Currency code (e.g., "USD", "EUR", "GBP")
 * @param isCents - Whether the price is in cents (default: true)
 * @returns Formatted price string with correct currency symbol
 */
export function formatPriceInCurrency(
  price: number | string,
  currency: string = "USD",
  isCents: boolean = true
): string {
  const numericPrice = typeof price === "string" ? parseFloat(price) : price;
  
  // Convert cents to currency units if needed
  const priceInCurrency = isCents ? numericPrice / 100 : numericPrice;
  
  // Get decimal places for the currency (JPY and HUF have 0 decimals, others have 2)
  const decimals = currency === "JPY" || currency === "HUF" || currency === "IDR" || currency === "XOF" ? 0 : 2;
  
  // Use appropriate locale based on currency
  const localeMap: Record<string, string> = {
    USD: "en-US",
    EUR: "de-DE",
    GBP: "en-GB",
    CAD: "en-CA",
    AUD: "en-AU",
    JPY: "ja-JP",
    INR: "en-IN",
    SGD: "en-SG",
    CHF: "de-CH",
    DKK: "da-DK",
    NOK: "nb-NO",
    SEK: "sv-SE",
    CZK: "cs-CZ",
    HUF: "hu-HU",
    BGN: "bg-BG",
    RON: "ro-RO",
    PLN: "pl-PL",
    HKD: "en-HK",
    THB: "th-TH",
    MYR: "ms-MY",
    IDR: "id-ID",
    NZD: "en-NZ",
    BRL: "pt-BR",
    MXN: "es-MX",
    ZAR: "en-ZA",
    GHS: "en-GH",
    KES: "en-KE",
    NGN: "en-NG",
    AED: "ar-AE",
    XOF: "fr-FR",
    GIP: "en-GB",
  };
  
  const locale = localeMap[currency] || "en-US";
  
  // Ensure currency is uppercase (required by Intl.NumberFormat)
  const currencyUpper = currency.toUpperCase();
  
  // Debug logging in development
  if (process.env.NODE_ENV === "development" && currencyUpper !== "USD") {
    console.log("formatPriceInCurrency called:", {
      price,
      currency: currencyUpper,
      isCents,
      priceInCurrency,
      locale,
      decimals,
    });
  }
  
  try {
    // Use Intl.NumberFormat with the currency code
    // Note: Some browsers may not support all currency codes, so we'll test it
    const formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyUpper, // Must be uppercase
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    
    let formatted = formatter.format(priceInCurrency);
    
    // Debug logging in development
    if (process.env.NODE_ENV === "development" && currencyUpper !== "USD") {
      console.log("formatPriceInCurrency result:", formatted);
      console.log("Formatter options:", {
        locale,
        currency: currencyUpper,
        style: "currency",
      });
    }
    
    // Check if the formatting actually worked correctly
    // If currency is NZD but result starts with $ (and not NZ$), try alternative approach
    if (currencyUpper !== "USD" && formatted.startsWith("$") && !formatted.includes("NZ") && !formatted.includes(currencyUpper)) {
      // Try using the currency code directly in the locale
      try {
        const altFormatter = new Intl.NumberFormat(locale, {
          style: "currency",
          currency: currencyUpper,
        });
        formatted = altFormatter.format(priceInCurrency);
        
        // If still not working, manually format with currency symbol
        if (formatted.startsWith("$") && currencyUpper !== "USD") {
          // Get currency symbol from data/units
          const symbol = getCurrencySymbol(currencyUpper);
          formatted = `${symbol}${priceInCurrency.toFixed(decimals)}`;
          if (process.env.NODE_ENV === "development") {
            console.log("Using manual currency formatting:", formatted);
          }
        }
      } catch (altError) {
        console.warn("Alternative formatting failed, using manual format");
        // Manual fallback: use currency symbol from units
        const symbol = getCurrencySymbol(currencyUpper);
        formatted = `${symbol}${priceInCurrency.toFixed(decimals)}`;
      }
    }
    
    return formatted;
  } catch (error) {
    console.error("Error formatting price:", {
      price,
      currency: currencyUpper,
      locale,
      error: error instanceof Error ? error.message : String(error),
    });
    // Fallback: use currency symbol from units data
    try {
      const symbol = getCurrencySymbol(currencyUpper);
      return `${symbol}${priceInCurrency.toFixed(decimals)}`;
    } catch (fallbackError) {
      // Final fallback to USD formatting
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(priceInCurrency);
    }
  }
}

export function shopNameSlugify(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "") // Remove spaces
    .replace(/[^\w-]+/g, ""); // Remove special characters
}

/**
 * Generates a unique referral code in the format YARNNU-XXXX-XXXX
 * @returns A referral code string
 */
export function generateReferralCode(): string {
  // Generate two random 4-character strings using alphanumeric characters
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part1 = Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  const part2 = Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  
  return `YARNNU-${part1}-${part2}`;
}

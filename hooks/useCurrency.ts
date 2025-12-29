import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SUPPORTED_CURRENCIES, CurrencyCode, getCurrencyDecimals } from '@/data/units';

type CurrencyStore = {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  formatPrice: (amount: number, isCents?: boolean, fromCurrency?: string) => Promise<string>;
  batchFormatPrices: (amounts: number[], fromCurrency: string, isCents?: boolean) => Promise<string[]>;
  SUPPORTED_CURRENCIES: typeof SUPPORTED_CURRENCIES;
};

// Currency formatting options
const CURRENCY_FORMATS: Record<string, { locale: string }> = {
  USD: { locale: 'en-US' },
  EUR: { locale: 'de-DE' },
  GBP: { locale: 'en-GB' },
  CAD: { locale: 'en-CA' },
  AUD: { locale: 'en-AU' },
  JPY: { locale: 'ja-JP' },
  INR: { locale: 'en-IN' },
  SGD: { locale: 'en-SG' },
};

// Client-side cache for conversions with TTL
class ConversionCache {
  private cache: Map<string, { value: number; timestamp: number }> = new Map();
  private readonly ttl: number; // Time to live in milliseconds (default 5 minutes)

  constructor(ttl: number = 5 * 60 * 1000) {
    this.ttl = ttl;
  }

  // Generate cache key from conversion parameters
  private getKey(amount: number, fromCurrency: string, toCurrency: string, isCents: boolean): string {
    // Round amount to avoid cache misses due to floating point precision
    const roundedAmount = Math.round(amount * 100) / 100;
    return `${roundedAmount}_${fromCurrency.toLowerCase()}_${toCurrency.toLowerCase()}_${isCents}`;
  }

  // Get cached conversion
  get(amount: number, fromCurrency: string, toCurrency: string, isCents: boolean): number | null {
    const key = this.getKey(amount, fromCurrency, toCurrency, isCents);
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

    return cached.value;
  }

  // Set conversion in cache
  set(amount: number, fromCurrency: string, toCurrency: string, isCents: boolean, value: number): void {
    const key = this.getKey(amount, fromCurrency, toCurrency, isCents);
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  // Clear cache (useful when currency changes)
  clear(): void {
    this.cache.clear();
  }
}

// Create client-side conversion cache (5 minute TTL)
const conversionCache = new ConversionCache(5 * 60 * 1000);

// Convert price from one currency to another using the API
async function convertPrice(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  isCents: boolean = false
): Promise<number> {
  // Check cache first
  const cached = conversionCache.get(amount, fromCurrency, toCurrency, isCents);
  if (cached !== null) {
    return cached;
  }

  try {
    const response = await fetch('/api/currency/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        fromCurrency,
        toCurrency,
        isCents,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to convert currency');
    }

    const data = await response.json();
    const convertedAmount = data.convertedAmount;

    // Cache the result
    conversionCache.set(amount, fromCurrency, toCurrency, isCents, convertedAmount);

    return convertedAmount;
  } catch (error) {
    console.error('Error converting price:', error);
    // Return original amount if conversion fails
    return isCents ? amount : amount * 100;
  }
}

// Batch convert multiple prices efficiently
async function batchConvertPrices(
  amounts: number[],
  fromCurrency: string,
  toCurrency: string,
  isCents: boolean = false
): Promise<number[]> {
  // Check cache for each amount first
  const results: (number | null)[] = [];
  const uncachedIndices: number[] = [];
  const uncachedAmounts: number[] = [];

  amounts.forEach((amount, index) => {
    const cached = conversionCache.get(amount, fromCurrency, toCurrency, isCents);
    if (cached !== null) {
      results[index] = cached;
    } else {
      results[index] = null;
      uncachedIndices.push(index);
      uncachedAmounts.push(amount);
    }
  });

  // If all were cached, return results
  if (uncachedIndices.length === 0) {
    return results as number[];
  }

  // Batch convert uncached amounts
  try {
    const response = await fetch('/api/currency/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversions: uncachedAmounts.map(amount => ({
          amount,
          fromCurrency,
          toCurrency,
          isCents,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to batch convert currency');
    }

    const data = await response.json();
    const convertedAmounts = data.convertedAmounts;

    // Cache results and fill in the results array
    uncachedIndices.forEach((originalIndex, batchIndex) => {
      const amount = uncachedAmounts[batchIndex];
      const convertedAmount = convertedAmounts[batchIndex];
      results[originalIndex] = convertedAmount;
      conversionCache.set(amount, fromCurrency, toCurrency, isCents, convertedAmount);
    });

    return results as number[];
  } catch (error) {
    console.error('Error batch converting prices:', error);
    // Fallback: try individual conversions for uncached items
    const fallbackResults = await Promise.all(
      uncachedAmounts.map(amount => convertPrice(amount, fromCurrency, toCurrency, isCents))
    );
    
    uncachedIndices.forEach((originalIndex, batchIndex) => {
      results[originalIndex] = fallbackResults[batchIndex];
    });

    return results as number[];
  }
}

// Format a price in the specified currency
function formatPriceInCurrency(
  amount: number,
  currency: string,
  isCents: boolean = false
): string {
  const format = CURRENCY_FORMATS[currency] || CURRENCY_FORMATS.USD;
  const decimals = getCurrencyDecimals(currency);
  const amountToFormat = isCents ? amount / 100 : amount;

  return new Intl.NumberFormat(format.locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amountToFormat);
}

export const useCurrency = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      currency: 'USD',
      setCurrency: (currency: CurrencyCode) => {
        // Clear conversion cache when currency changes
        conversionCache.clear();
        set({ currency });
      },
      formatPrice: async (amount: number, isCents: boolean = false, fromCurrency: string = 'USD') => {
        const { currency } = get();
        const format = CURRENCY_FORMATS[currency] || CURRENCY_FORMATS.USD;
        const decimals = getCurrencyDecimals(currency);

        try {
          // Convert the price from the product's currency to the selected currency
          const convertedAmount = await convertPrice(
            amount,
            fromCurrency.toUpperCase(), // Use the product's currency, default to USD
            currency,
            isCents
          );

          // Format the converted amount
          return new Intl.NumberFormat(format.locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }).format(isCents ? convertedAmount / 100 : convertedAmount);
        } catch (error) {
          console.error('Error formatting price:', error);
          // Fallback to formatting in the original currency if conversion fails
          return formatPriceInCurrency(amount, fromCurrency.toUpperCase(), isCents);
        }
      },
      batchFormatPrices: async (amounts: number[], fromCurrency: string = 'USD', isCents: boolean = false) => {
        const { currency } = get();
        const format = CURRENCY_FORMATS[currency] || CURRENCY_FORMATS.USD;
        const decimals = getCurrencyDecimals(currency);

        try {
          // Batch convert all prices to the selected currency
          const convertedAmounts = await batchConvertPrices(amounts, fromCurrency, currency, isCents);

          // Format all converted amounts
          return convertedAmounts.map(convertedAmount =>
            new Intl.NumberFormat(format.locale, {
              style: 'currency',
              currency: currency,
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            }).format(isCents ? convertedAmount / 100 : convertedAmount)
          );
        } catch (error) {
          console.error('Error batch formatting prices:', error);
          // Fallback to USD formatting if conversion fails
          return amounts.map(amount => formatPriceInCurrency(amount, 'USD', isCents));
        }
      },
      SUPPORTED_CURRENCIES,
    }),
    {
      name: 'currency-storage',
    }
  )
); 
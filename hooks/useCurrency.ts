import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SUPPORTED_CURRENCIES, CurrencyCode, getCurrencyDecimals } from '@/data/units';

type CurrencyStore = {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  formatPrice: (amount: number, isCents?: boolean) => Promise<string>;
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

// Convert price from one currency to another using the API
async function convertPrice(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  isCents: boolean = false
): Promise<number> {
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
    return data.convertedAmount;
  } catch (error) {
    console.error('Error converting price:', error);
    // Return original amount if conversion fails
    return isCents ? amount : amount * 100;
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
      setCurrency: (currency: CurrencyCode) => set({ currency }),
      formatPrice: async (amount: number, isCents: boolean = false) => {
        const { currency } = get();
        const format = CURRENCY_FORMATS[currency] || CURRENCY_FORMATS.USD;
        const decimals = getCurrencyDecimals(currency);

        try {
          // Convert the price to the selected currency
          const convertedAmount = await convertPrice(
            amount,
            'USD', // Assuming prices are stored in USD
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
          // Fallback to USD formatting if conversion fails
          return formatPriceInCurrency(amount, 'USD', isCents);
        }
      },
      SUPPORTED_CURRENCIES,
    }),
    {
      name: 'currency-storage',
    }
  )
); 
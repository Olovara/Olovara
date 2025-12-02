import { useState, useEffect, useMemo } from 'react';
import { useCurrency } from './useCurrency';
import { SUPPORTED_CURRENCIES, getCurrencyDecimals } from '@/data/units';

/**
 * Hook to efficiently batch convert and format prices for multiple products
 * This is optimized for product listings where all products need conversion to the same currency
 * 
 * @param products - Array of products with price and currency information
 * @returns Object with converted prices and loading state
 */
export function useBatchCurrency<T extends { price: number; currency?: string }>(
  products: T[]
) {
  const { currency, batchFormatPrices } = useCurrency();
  const [convertedPrices, setConvertedPrices] = useState<Map<number, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Memoize the conversion request to avoid unnecessary recalculations
  const conversionData = useMemo(() => {
    if (!products || products.length === 0) {
      return { currencyGroups: new Map(), totalProducts: 0 };
    }

    // Group products by currency to optimize batch conversion
    const currencyGroups = new Map<string, { amounts: number[]; indices: number[] }>();
    
    products.forEach((product, index) => {
      const productCurrency = (product.currency || 'USD').toUpperCase();
      if (!currencyGroups.has(productCurrency)) {
        currencyGroups.set(productCurrency, { amounts: [], indices: [] });
      }
      currencyGroups.get(productCurrency)!.amounts.push(product.price);
      currencyGroups.get(productCurrency)!.indices.push(index);
    });

    return { currencyGroups, totalProducts: products.length };
  }, [products]);

  useEffect(() => {
    const convertAllPrices = async () => {
      if (!products || products.length === 0) {
        setConvertedPrices(new Map());
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const newConvertedPrices = new Map<number, string>();

      try {
        // Convert prices for each currency group in parallel
        const conversionPromises = Array.from(conversionData.currencyGroups.entries()).map(
          async ([productCurrency, { amounts, indices }]) => {
            // If the product currency matches the user's selected currency, no conversion needed
            if (productCurrency === currency) {
              const decimals = getCurrencyDecimals(productCurrency);
              
              amounts.forEach((amount: number, i: number) => {
                const formatted = new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: productCurrency,
                  minimumFractionDigits: decimals,
                  maximumFractionDigits: decimals,
                }).format(amount / 100); // Convert from cents
                
                newConvertedPrices.set(indices[i], formatted);
              });
            } else {
              // Batch convert prices for this currency group
              const formattedPrices = await batchFormatPrices(
                amounts,
                productCurrency,
                true // prices are in cents
              );
              
              formattedPrices.forEach((formatted: string, i: number) => {
                newConvertedPrices.set(indices[i], formatted);
              });
            }
          }
        );

        await Promise.all(conversionPromises);
        setConvertedPrices(newConvertedPrices);
      } catch (error) {
        console.error('Error batch converting prices:', error);
        // Fallback: format prices in their original currency
        products.forEach((product: T, index: number) => {
          const productCurrency = (product.currency || 'USD').toUpperCase();
          const decimals = getCurrencyDecimals(productCurrency);
          
          const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: productCurrency,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }).format(product.price / 100);
          
          newConvertedPrices.set(index, formatted);
        });
        setConvertedPrices(newConvertedPrices);
      } finally {
        setIsLoading(false);
      }
    };

    convertAllPrices();
  }, [products, currency, batchFormatPrices, conversionData]);

  // Helper function to get converted price for a specific product index
  const getConvertedPrice = (index: number): string => {
    return convertedPrices.get(index) || '';
  };

  return {
    convertedPrices,
    getConvertedPrice,
    isLoading,
  };
}


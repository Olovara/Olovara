import { useLocation } from './useLocation';
import { useCurrency } from './useCurrency';
import { useEffect } from 'react';

/**
 * Hook to automatically detect user location and set currency preferences
 * This is a convenience hook that combines location and currency stores
 */
export function useLocationDetection() {
  const { 
    locationPreferences, 
    isDetecting, 
    error, 
    detectLocation,
    currentCountry,
    currentCurrency 
  } = useLocation();
  
  const { currency, setCurrency } = useCurrency();

  // Auto-detect location on first load
  useEffect(() => {
    if (!locationPreferences && !isDetecting) {
      detectLocation();
    }
  }, [locationPreferences, isDetecting, detectLocation]);

  // Sync location store currency with currency store
  useEffect(() => {
    if (currentCurrency && currentCurrency !== currency) {
      setCurrency(currentCurrency);
    }
  }, [currentCurrency, currency, setCurrency]);

  return {
    locationPreferences,
    isLoading: isDetecting,
    error,
    refreshLocation: detectLocation,
    currentCountry,
    currentCurrency,
  };
} 
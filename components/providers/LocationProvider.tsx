'use client';

import { useEffect } from 'react';
import { useLocation } from '@/hooks/useLocation';
import { useCurrency } from '@/hooks/useCurrency';

interface LocationProviderProps {
  children: React.ReactNode;
}

/**
 * Provider that automatically detects user location and sets currency preferences
 * This runs silently in the background without showing any UI
 */
export function LocationProvider({ children }: LocationProviderProps) {
  const { 
    locationPreferences, 
    isDetecting, 
    currentCurrency,
    detectLocation 
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

  // Log analytics data for fraud detection and analytics
  useEffect(() => {
    if (locationPreferences && !isDetecting) {
      // You can send this data to your analytics service
      console.log('Location detected:', {
        country: locationPreferences.countryName,
        countryCode: locationPreferences.countryCode,
        currency: locationPreferences.currency,
        continent: locationPreferences.continent,
        isSupported: locationPreferences.isSupported,
        canOnboardSellers: locationPreferences.canOnboardSellers,
        timestamp: new Date().toISOString(),
      });
    }
  }, [locationPreferences, isDetecting]);

  // This provider doesn't render anything, it just handles location detection
  return <>{children}</>;
} 
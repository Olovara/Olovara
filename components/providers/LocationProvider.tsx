'use client';

import { useEffect } from 'react';
import { useLocationDetection } from '@/hooks/useLocationDetection';
import { useCurrency } from '@/hooks/useCurrency';

interface LocationProviderProps {
  children: React.ReactNode;
}

/**
 * Provider that automatically detects user location and sets currency preferences
 * This runs silently in the background without showing any UI
 */
export function LocationProvider({ children }: LocationProviderProps) {
  const { locationPreferences, isLoading, error } = useLocationDetection();
  const { currency, setCurrency } = useCurrency();

  useEffect(() => {
    // Only set currency if we have location preferences and currency is different
    if (locationPreferences?.currency && locationPreferences.currency !== currency) {
      setCurrency(locationPreferences.currency);
    }
  }, [locationPreferences, currency, setCurrency]);

  // Log analytics data for fraud detection and analytics
  useEffect(() => {
    if (locationPreferences && !isLoading && !error) {
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
  }, [locationPreferences, isLoading, error]);

  // This provider doesn't render anything, it just handles location detection
  return <>{children}</>;
} 
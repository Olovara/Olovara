import { useState, useEffect } from 'react';
import { useCurrency } from './useCurrency';
import { UserLocationPreferences } from '@/lib/ipinfo';

interface UseLocationDetectionReturn {
  locationPreferences: UserLocationPreferences | null;
  isLoading: boolean;
  error: string | null;
  refreshLocation: () => Promise<void>;
}

/**
 * Hook to automatically detect user location and set currency preferences
 */
export function useLocationDetection(): UseLocationDetectionReturn {
  const [locationPreferences, setLocationPreferences] = useState<UserLocationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setCurrency } = useCurrency();

  const fetchLocationPreferences = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/location/preferences');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get location preferences');
      }

      const prefs = data.data.locationPreferences;
      setLocationPreferences(prefs);

      // Automatically set currency based on location
      if (prefs.currency) {
        setCurrency(prefs.currency);
      }

      // Log analytics data (you can send this to your analytics service)
      console.log('User Analytics:', data.data.analytics);

    } catch (err) {
      console.error('Error fetching location preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to detect location');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshLocation = async () => {
    await fetchLocationPreferences();
  };

  useEffect(() => {
    fetchLocationPreferences();
  }, []);

  return {
    locationPreferences,
    isLoading,
    error,
    refreshLocation,
  };
} 
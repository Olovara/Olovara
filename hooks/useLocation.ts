import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SUPPORTED_COUNTRIES, Country } from '@/data/countries';
import { SUPPORTED_CURRENCIES, CurrencyCode } from '@/data/units';

interface LocationPreferences {
  countryCode: string;
  countryName: string;
  currency: CurrencyCode;
  continent: string;
  isSupported: boolean;
  canOnboardSellers: boolean;
  lastDetected: string; // ISO timestamp
}

interface LocationStore {
  // Current preferences
  locationPreferences: LocationPreferences | null;
  currentCountry: Country | null;
  isDetecting: boolean;
  error: string | null;
  
  // Actions
  setLocationPreferences: (prefs: LocationPreferences) => void;
  detectLocation: () => Promise<void>;
  setCountry: (countryCode: string) => void;
  setCurrency: (currency: CurrencyCode) => void;
  clearError: () => void;
  
  // Helper getters
  currentCurrency: CurrencyCode;
}

// Check if we should detect location (not detected in last 24 hours)
const shouldDetectLocation = (lastDetected: string): boolean => {
  const lastDetectedDate = new Date(lastDetected);
  const now = new Date();
  const hoursSinceLastDetection = (now.getTime() - lastDetectedDate.getTime()) / (1000 * 60 * 60);
  return hoursSinceLastDetection >= 24;
};

// Helper function to find country from preferences
const findCountryFromPreferences = (prefs: LocationPreferences | null): Country | null => {
  if (!prefs) return null;
  
  console.log('findCountryFromPreferences called with:', prefs);
  console.log('SUPPORTED_COUNTRIES length:', SUPPORTED_COUNTRIES.length);
  
  // First try to find the exact country code
  let country = SUPPORTED_COUNTRIES.find(c => c.code === prefs.countryCode);
  console.log('Looking for country code:', prefs.countryCode, 'Found:', country?.name);
  
  // If not found, try to find a country with the same currency
  if (!country) {
    country = SUPPORTED_COUNTRIES.find(c => c.currency === prefs.currency);
    console.log('Looking for country with currency:', prefs.currency, 'Found:', country?.name);
  }
  
  // If still not found, try to find US as fallback
  if (!country) {
    country = SUPPORTED_COUNTRIES.find(c => c.code === 'US');
    console.log('Using US fallback, Found:', country?.name);
  }
  
  console.log('Final country result:', country?.name);
  return country || null;
};

export const useLocation = create<LocationStore>()(
  persist(
    (set, get) => ({
      locationPreferences: null,
      currentCountry: null,
      isDetecting: false,
      error: null,

      setLocationPreferences: (prefs: LocationPreferences) => {
        const country = findCountryFromPreferences(prefs);
        set({ locationPreferences: prefs, currentCountry: country, error: null });
      },

      detectLocation: async () => {
        const { locationPreferences } = get();
        
        // If we have recent location data, don't detect again
        if (locationPreferences && !shouldDetectLocation(locationPreferences.lastDetected)) {
          return;
        }

        set({ isDetecting: true, error: null });

        try {
          const response = await fetch('/api/location/preferences');
          const data = await response.json();

          if (!data.success) {
            throw new Error(data.error || 'Failed to detect location');
          }

          const prefs: LocationPreferences = {
            ...data.data.locationPreferences,
            lastDetected: new Date().toISOString(),
          };

          const country = findCountryFromPreferences(prefs);

          set({ 
            locationPreferences: prefs, 
            currentCountry: country,
            isDetecting: false, 
            error: null 
          });

        } catch (error) {
          console.error('Error detecting location:', error);
          set({ 
            isDetecting: false, 
            error: error instanceof Error ? error.message : 'Failed to detect location' 
          });
        }
      },

      setCountry: (countryCode: string) => {
        const { locationPreferences } = get();
        if (!locationPreferences) return;

        const country = SUPPORTED_COUNTRIES.find(c => c.code === countryCode);
        if (!country) return;

        const updatedPrefs: LocationPreferences = {
          ...locationPreferences,
          countryCode: country.code,
          countryName: country.name,
          currency: country.currency as CurrencyCode,
          lastDetected: new Date().toISOString(),
        };

        set({ locationPreferences: updatedPrefs, currentCountry: country });
      },

      setCurrency: (currency: CurrencyCode) => {
        const { locationPreferences } = get();
        if (!locationPreferences) return;

        const updatedPrefs: LocationPreferences = {
          ...locationPreferences,
          currency,
          lastDetected: new Date().toISOString(),
        };

        set({ locationPreferences: updatedPrefs });
      },

      clearError: () => set({ error: null }),

      // Computed getters
      get currentCurrency() {
        const { locationPreferences } = get();
        return locationPreferences?.currency || 'USD';
      },
    }),
    {
      name: 'location-storage',
      // Only persist locationPreferences, not the loading states
      partialize: (state) => ({ 
        locationPreferences: state.locationPreferences 
      }),
      // Rehydrate currentCountry when loading from storage
      onRehydrateStorage: () => (state) => {
        if (state) {
          const country = findCountryFromPreferences(state.locationPreferences);
          state.currentCountry = country;
        }
      },
    }
  )
); 
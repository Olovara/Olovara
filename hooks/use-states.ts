import { useState, useEffect, useMemo } from 'react';
import { getStatesByCountry, hasStates, StateProvince, CountryStates } from '@/data/states';

interface UseStatesOptions {
  countryCode?: string;
  includeEmptyOption?: boolean;
  emptyOptionLabel?: string;
}

interface UseStatesReturn {
  states: StateProvince[];
  loading: boolean;
  hasStates: boolean;
  getStateByCode: (stateCode: string) => StateProvince | undefined;
  getStateByName: (stateName: string) => StateProvince | undefined;
  filterStates: (searchTerm: string) => StateProvince[];
}

/**
 * Custom hook for managing states/provinces selection
 * Provides states for a given country with search and filtering capabilities
 */
export const useStates = (options: UseStatesOptions = {}): UseStatesReturn => {
  const { 
    countryCode, 
    includeEmptyOption = false, 
    emptyOptionLabel = 'Select a state/province' 
  } = options;

  const [loading, setLoading] = useState(false);

  // Get states for the selected country
  const states = useMemo(() => {
    if (!countryCode) return [];

    setLoading(true);
    
    try {
      const countryStates = getStatesByCountry(countryCode);
      
      // Add empty option if requested
      if (includeEmptyOption && countryStates.length > 0) {
        return [
          { code: '', name: emptyOptionLabel, type: 'state' as const },
          ...countryStates
        ];
      }
      
      return countryStates;
    } finally {
      setLoading(false);
    }
  }, [countryCode, includeEmptyOption, emptyOptionLabel]);

  // Check if the country has states
  const hasStatesForCountry = useMemo(() => {
    return countryCode ? hasStates(countryCode) : false;
  }, [countryCode]);

  // Get state by code
  const getStateByCode = (stateCode: string): StateProvince | undefined => {
    if (!countryCode || !stateCode) return undefined;
    return states.find(state => state.code === stateCode);
  };

  // Get state by name
  const getStateByName = (stateName: string): StateProvince | undefined => {
    if (!countryCode || !stateName) return undefined;
    return states.find(state => 
      state.name.toLowerCase() === stateName.toLowerCase()
    );
  };

  // Filter states by search term
  const filterStates = (searchTerm: string): StateProvince[] => {
    if (!searchTerm.trim()) return states;
    
    const term = searchTerm.toLowerCase();
    return states.filter(state => 
      state.name.toLowerCase().includes(term) ||
      state.code.toLowerCase().includes(term)
    );
  };

  return {
    states,
    loading,
    hasStates: hasStatesForCountry,
    getStateByCode,
    getStateByName,
    filterStates
  };
};

/**
 * Hook for getting all countries with their states data
 * Useful for building country-state selection components
 */
export const useAllCountriesStates = () => {
  const [countriesStates, setCountriesStates] = useState<Record<string, CountryStates>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCountriesStates = async () => {
      setLoading(true);
      try {
        // Import dynamically to avoid circular dependencies
        const { getOnboardingCountriesStates } = await import('@/data/states');
        const states = getOnboardingCountriesStates();
        setCountriesStates(states);
      } catch (error) {
        console.error('Error loading countries states:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCountriesStates();
  }, []);

  return {
    countriesStates,
    loading,
    getCountryStates: (countryCode: string) => countriesStates[countryCode],
    hasCountryStates: (countryCode: string) => countryCode in countriesStates
  };
};

/**
 * Hook for state/province validation
 * Provides validation functions for state selection
 */
export const useStateValidation = (countryCode?: string) => {
  const { states, hasStates: hasStatesForCountry } = useStates({ countryCode });

  const validateStateCode = (stateCode: string): boolean => {
    if (!countryCode || !hasStatesForCountry) return true; // No validation needed
    if (!stateCode) return false; // State is required for countries with states
    
    return states.some(state => state.code === stateCode);
  };

  const validateStateName = (stateName: string): boolean => {
    if (!countryCode || !hasStatesForCountry) return true; // No validation needed
    if (!stateName) return false; // State is required for countries with states
    
    return states.some(state => 
      state.name.toLowerCase() === stateName.toLowerCase()
    );
  };

  const isStateRequired = (): boolean => {
    return countryCode ? hasStatesForCountry : false;
  };

  return {
    validateStateCode,
    validateStateName,
    isStateRequired,
    hasStates: hasStatesForCountry
  };
};

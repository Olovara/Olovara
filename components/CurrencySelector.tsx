import { useLocation } from '@/hooks/useLocation';
import { useCurrency } from '@/hooks/useCurrency';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUPPORTED_COUNTRIES } from '@/data/countries';
import { SUPPORTED_CURRENCIES } from '@/data/units';
import { useEffect } from 'react';

export function CurrencySelector() {
  const { 
    locationPreferences, 
    isDetecting, 
    currentCountry, 
    currentCurrency,
    detectLocation, 
    setCountry, 
    setCurrency 
  } = useLocation();
  
  const { currency, setCurrency: setCurrencyStore } = useCurrency();

  // Auto-detect location on first load
  useEffect(() => {
    if (!locationPreferences) {
      detectLocation();
    }
  }, [locationPreferences, detectLocation]);

  // Sync location store currency with currency store
  useEffect(() => {
    if (currentCurrency && currentCurrency !== currency) {
      setCurrencyStore(currentCurrency);
    }
  }, [currentCurrency, currency, setCurrencyStore]);

  const handleCountryChange = (countryCode: string) => {
    setCountry(countryCode);
    // Currency will be automatically updated based on the country
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency as any);
    setCurrencyStore(newCurrency as any);
  };

  // Get countries that have supported currencies
  const supportedCountries = SUPPORTED_COUNTRIES.filter(country =>
    SUPPORTED_CURRENCIES.some(curr => curr.code === country.currency)
  );

  if (isDetecting) {
    return (
      <div className="w-[180px] h-10 bg-gray-100 animate-pulse rounded-md flex items-center justify-center">
        <span className="text-sm text-gray-500">Detecting...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Country Selector */}
      <Select
        value={currentCountry?.code || ''}
        onValueChange={handleCountryChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select country" />
        </SelectTrigger>
        <SelectContent>
          {supportedCountries.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <div className="flex items-center gap-2">
                <span className="text-sm">{country.currencySymbol}</span>
                <span>{country.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Currency Selector */}
      <Select
        value={currency}
        onValueChange={handleCurrencyChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_CURRENCIES.map((curr) => (
            <SelectItem key={curr.code} value={curr.code}>
              <div className="flex items-center gap-2">
                <span className="text-sm">{curr.symbol}</span>
                <span>{curr.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 
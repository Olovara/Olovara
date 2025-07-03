'use client';

import { useState } from 'react';
import { useLocation } from '@/hooks/useLocation';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Globe, ChevronDown, Loader2 } from 'lucide-react';
import { SUPPORTED_COUNTRIES } from '@/data/countries';
import { SUPPORTED_CURRENCIES } from '@/data/units';

export function LocationModal() {
  const [isOpen, setIsOpen] = useState(false);
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

  // Get countries that have supported currencies
  const supportedCountries = SUPPORTED_COUNTRIES.filter(country =>
    SUPPORTED_CURRENCIES.some(curr => curr.code === country.currency)
  );

  const handleCountryChange = (countryCode: string) => {
    setCountry(countryCode);
    // Currency will be automatically updated based on the country
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency as any);
    setCurrencyStore(newCurrency as any);
  };

  // Auto-detect location if not already detected
  const handleOpen = () => {
    if (!locationPreferences && !isDetecting) {
      detectLocation();
    }
    setIsOpen(true);
  };

  // Get display text for the trigger button
  const getDisplayText = () => {
    if (isDetecting) {
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Detecting...</span>
        </div>
      );
    }

    if (locationPreferences && currentCountry) {
      return (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>{currentCountry.name}</span>
          <Badge variant="secondary" className="text-xs">
            {currentCurrency}
          </Badge>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4" />
        <span>Select location</span>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 h-auto p-2 hover:bg-gray-100"
          onClick={handleOpen}
        >
          {getDisplayText()}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Location & Currency</DialogTitle>
          <DialogDescription>
            Choose your location to see prices in your local currency and get relevant shipping options.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Location Display */}
          {locationPreferences && currentCountry && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Current Location</h4>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <span className="text-sm">{currentCountry.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {currentCurrency}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Detected automatically from your IP address
              </p>
            </div>
          )}

          {/* Country Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Country</label>
            <Select
              value={currentCountry?.code || ''}
              onValueChange={handleCountryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your country" />
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
          </div>

          {/* Currency Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Currency</label>
            <Select
              value={currency}
              onValueChange={handleCurrencyChange}
            >
              <SelectTrigger>
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

          {/* Info Text */}
          <div className="text-xs text-gray-500">
            <p>• Prices will be displayed in your selected currency</p>
            <p>• Shipping options and costs may vary by location</p>
            <p>• You can change this anytime from the footer</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
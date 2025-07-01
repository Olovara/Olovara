'use client';

import { useState } from 'react';
import { useLocationDetection } from '@/hooks/useLocationDetection';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Globe, Shield, AlertTriangle } from 'lucide-react';
import { SUPPORTED_COUNTRIES } from '@/data/countries';
import { SUPPORTED_CURRENCIES } from '@/data/units';

export function LocationDetector() {
  const { locationPreferences, isLoading, error, refreshLocation } = useLocationDetection();
  const { currency, setCurrency } = useCurrency();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleCurrencyChange = async (newCurrency: string) => {
    setIsUpdating(true);
    try {
      // Update currency in the store
      setCurrency(newCurrency as any);
      
      // Optionally save to backend
      await fetch('/api/location/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode: locationPreferences?.countryCode,
          currency: newCurrency,
        }),
      });
    } catch (err) {
      console.error('Error updating currency:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Detecting your location...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Location Detection Failed
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={refreshLocation} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!locationPreferences) {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Your Location
        </CardTitle>
        <CardDescription>
          We&apos;ve detected your location and set your preferences automatically
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Country:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm">{locationPreferences.countryName}</span>
              <Badge variant="secondary">{locationPreferences.countryCode}</Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Continent:</span>
            <span className="text-sm">{locationPreferences.continent}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={locationPreferences.isSupported ? "default" : "destructive"}>
              {locationPreferences.isSupported ? "Supported" : "Limited Support"}
            </Badge>
          </div>
        </div>

        {/* Currency Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Currency:</label>
          <Select
            value={currency}
            onValueChange={handleCurrencyChange}
            disabled={isUpdating}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_CURRENCIES.map((curr) => (
                <SelectItem key={curr.code} value={curr.code}>
                  {curr.symbol} {curr.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fraud Detection Info */}
        {locationPreferences && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Fraud protection active</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={refreshLocation} 
            variant="outline" 
            size="sm"
            disabled={isUpdating}
          >
            <Globe className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 
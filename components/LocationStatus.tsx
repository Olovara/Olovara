'use client';

import { useLocation } from '@/hooks/useLocation';
import { Badge } from '@/components/ui/badge';
import { MapPin, Globe, Loader2 } from 'lucide-react';

export function LocationStatus() {
  const { locationPreferences, isDetecting, error, currentCountry } = useLocation();

  if (isDetecting) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Detecting location...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <Globe className="h-3 w-3" />
        <span>Location detection failed</span>
      </div>
    );
  }

  if (!locationPreferences) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Globe className="h-3 w-3" />
        <span>Location not detected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <MapPin className="h-3 w-3 text-green-600" />
      <span>{locationPreferences.countryName}</span>
      <Badge variant="secondary" className="text-xs">
        {locationPreferences.currency}
      </Badge>
    </div>
  );
} 
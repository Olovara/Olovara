"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Globe, Info } from "lucide-react";
import { useLocation } from "@/hooks/useLocation";

interface LocationFilterNoticeProps {
  totalProducts: number;
  filteredProducts: number;
}

export function LocationFilterNotice({ totalProducts, filteredProducts }: LocationFilterNoticeProps) {
  const { locationPreferences } = useLocation();

  // Only show if there's a difference and we have location data
  if (!locationPreferences || totalProducts === filteredProducts) {
    return null;
  }

  const hiddenCount = totalProducts - filteredProducts;

  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50">
      <Globe className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <strong>Location-based filtering active:</strong> Showing {filteredProducts} of {totalProducts} products 
        available in {locationPreferences.countryName}.         {hiddenCount} product{hiddenCount !== 1 ? 's' : ''} 
        {hiddenCount !== 1 ? ' are' : ' is'} hidden because the seller{hiddenCount !== 1 ? 's' : ''} 
        don&apos;t ship to your location.
      </AlertDescription>
    </Alert>
  );
}

export function LocationFilterInfo() {
  const { locationPreferences } = useLocation();

  if (!locationPreferences) {
    return null;
  }

  return (
    <Alert className="mb-4 border-green-200 bg-green-50">
      <Info className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        Products are automatically filtered to show only those available in {locationPreferences.countryName}.
      </AlertDescription>
    </Alert>
  );
} 
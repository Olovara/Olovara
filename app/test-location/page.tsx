'use client';

import { useLocation } from '@/hooks/useLocation';
import { useCurrency } from '@/hooks/useCurrency';
import { LocationModal } from '@/components/LocationModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestLocationPage() {
  const { 
    locationPreferences, 
    isDetecting, 
    currentCountry, 
    currentCurrency,
    detectLocation,
    clearError 
  } = useLocation();
  
  const { currency } = useCurrency();

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Location Detection Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Location Store State */}
        <Card>
          <CardHeader>
            <CardTitle>Location Store State</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Is Detecting:</strong> {isDetecting ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Current Country:</strong> {currentCountry?.name || 'None'}
            </div>
            <div>
              <strong>Current Currency:</strong> {currentCurrency}
            </div>
            <div>
              <strong>Currency Store:</strong> {currency}
            </div>
            <div>
              <strong>Location Preferences:</strong>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {JSON.stringify(locationPreferences, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={detectLocation} disabled={isDetecting}>
              {isDetecting ? 'Detecting...' : 'Detect Location'}
            </Button>
            <Button onClick={clearError} variant="outline">
              Clear Error
            </Button>
            <LocationModal />
          </CardContent>
        </Card>
      </div>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            This page helps debug the location detection system. Check the browser console for detailed logs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 
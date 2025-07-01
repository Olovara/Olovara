import { LocationDetector } from '@/components/LocationDetector';
import { LocationProvider } from '@/components/providers/LocationProvider';

export default function TestLocationPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">IPinfo Location Detection Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Location Detector Component */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Location Detection</h2>
            <LocationDetector />
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">How it works</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                This page demonstrates the IPinfo integration for your marketplace:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Automatically detects user&apos;s country and continent</li>
                <li>Sets appropriate currency based on location</li>
                <li>Provides fraud detection indicators</li>
                <li>Collects analytics data for platform insights</li>
                <li>Allows manual currency override</li>
              </ul>
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Next Steps:</h3>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Add IPINFO_TOKEN to your .env file</li>
                  <li>Integrate LocationProvider into your main layout</li>
                  <li>Use location data for product filtering</li>
                  <li>Implement fraud detection in checkout</li>
                  <li>Add analytics tracking</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* API Test Section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">API Endpoints</h2>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">GET /api/location/preferences</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Get user location preferences based on IP address
              </p>
              <code className="text-xs bg-muted p-2 rounded block">
                curl https://your-domain.com/api/location/preferences
              </code>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">POST /api/location/preferences</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Update user location preferences manually
              </p>
              <code className="text-xs bg-muted p-2 rounded block">
                {`curl -X POST https://your-domain.com/api/location/preferences \\
  -H "Content-Type: application/json" \\
  -d '{"countryCode": "US", "currency": "USD"}'`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
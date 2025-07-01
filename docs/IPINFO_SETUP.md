# IPinfo Integration Setup Guide

This guide will help you set up IPinfo location detection for your marketplace to automatically detect user location, set currency preferences, and provide fraud detection.

## 🚀 Quick Start

### 1. Get Your IPinfo Token

1. Sign up at [ipinfo.io](https://ipinfo.io)
2. Get your API token from the dashboard
3. Add it to your `.env` file:

```env
IPINFO_TOKEN=your_token_here
```

### 2. Test the Integration

Visit `/test-location` to see the location detection in action.

## 📁 Files Created

### Core Files
- `lib/ipinfo.ts` - Main IPinfo utility functions
- `types/ipinfo.d.ts` - TypeScript declarations
- `hooks/useLocationDetection.ts` - React hook for location detection
- `components/LocationDetector.tsx` - UI component for location display
- `components/providers/LocationProvider.tsx` - Provider for automatic detection
- `actions/locationActions.ts` - Server actions for database operations

### API Endpoints
- `app/api/location/preferences/route.ts` - Location preferences API

### Test Page
- `app/test-location/page.tsx` - Demo page to test the integration

## 🔧 Integration Steps

### 1. Add LocationProvider to Your Layout

Update your `app/layout.tsx` to include the LocationProvider:

```tsx
import { LocationProvider } from '@/components/providers/LocationProvider';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>
          <LocationProvider>
            <SocketProvider>
              {children}
            </SocketProvider>
          </LocationProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

### 2. Use Location Detection in Components

```tsx
import { useLocationDetection } from '@/hooks/useLocationDetection';

function MyComponent() {
  const { locationPreferences, isLoading } = useLocationDetection();
  
  if (isLoading) return <div>Detecting location...</div>;
  
  return (
    <div>
      <p>Welcome from {locationPreferences?.countryName}!</p>
      <p>Currency: {locationPreferences?.currency}</p>
    </div>
  );
}
```

## 🎯 Features

### ✅ Automatic Location Detection
- Detects user's country and continent
- Sets appropriate currency automatically
- Works with your existing currency system

### ✅ Fraud Detection
- Identifies VPN/Proxy usage
- Detects data center IPs
- Flags suspicious ASNs
- Provides risk assessment

### ✅ Analytics & Insights
- Collects user location data
- Tracks currency preferences
- Monitors platform usage by region
- Helps with fraud prevention

### ✅ Manual Override
- Users can manually change currency
- Preferences saved to database
- Respects user choices

## 🔒 Security & Privacy

### Data Collected
- IP address (for geolocation)
- Country and continent
- ASN information
- Currency preferences

### Data Usage
- Location detection for currency
- Fraud prevention
- Analytics (anonymized)
- User experience improvement

### Compliance
- GDPR compliant (IP addresses are not stored permanently)
- User consent for location detection
- Transparent data usage

## 🛠️ API Usage

### Get Location Preferences
```bash
GET /api/location/preferences
```

Response:
```json
{
  "success": true,
  "data": {
    "locationPreferences": {
      "countryCode": "US",
      "countryName": "United States",
      "currency": "USD",
      "continent": "North America",
      "isSupported": true,
      "canOnboardSellers": true
    },
    "analytics": {
      "ip": "8.8.8.8",
      "country": "United States",
      "fraudCheck": {
        "isSuspicious": false,
        "reasons": []
      }
    }
  }
}
```

### Update Preferences
```bash
POST /api/location/preferences
Content-Type: application/json

{
  "countryCode": "US",
  "currency": "USD"
}
```

## 🎨 Customization

### Supported Countries
Edit `data/countries.ts` to add/remove supported countries and their currencies.

### Fraud Detection Rules
Modify the `checkIPSuspicious` function in `lib/ipinfo.ts` to add custom fraud detection rules.

### Currency Formatting
Update `hooks/useCurrency.ts` to add new currency formats and conversion rates.

## 🚨 Troubleshooting

### Common Issues

1. **"Failed to fetch IP information"**
   - Check your IPINFO_TOKEN is set correctly
   - Verify your IPinfo account is active
   - Check network connectivity

2. **Currency not updating**
   - Ensure LocationProvider is in your layout
   - Check browser console for errors
   - Verify currency is in SUPPORTED_CURRENCIES

3. **TypeScript errors**
   - Run `npm install` to ensure all dependencies are installed
   - Check that `types/ipinfo.d.ts` is in your tsconfig paths

### Debug Mode

Add this to your component to see detailed logs:

```tsx
const { locationPreferences, isLoading, error } = useLocationDetection();

useEffect(() => {
  console.log('Location Debug:', { locationPreferences, isLoading, error });
}, [locationPreferences, isLoading, error]);
```

## 📈 Next Steps

1. **Product Filtering**: Use location data to show relevant products
2. **Shipping Calculation**: Calculate shipping based on user location
3. **Tax Calculation**: Apply appropriate taxes based on country
4. **Fraud Prevention**: Implement checkout fraud checks
5. **Analytics Dashboard**: Create admin dashboard for location analytics

## 🤝 Support

If you need help with the integration:
1. Check the test page at `/test-location`
2. Review the console logs for errors
3. Verify your IPinfo token is working
4. Test with different IP addresses

---

**Note**: This integration uses IPinfo Lite which provides country-level geolocation. For more precise location data, consider upgrading to a paid IPinfo plan. 
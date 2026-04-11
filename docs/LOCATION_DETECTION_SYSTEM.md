# Location Detection System

This document explains how the automatic location and currency detection system works in the OLOVARA marketplace.

## Overview

The system automatically detects a user's location based on their IP address and sets appropriate currency preferences. It works for both anonymous and logged-in users with intelligent caching to minimize API calls. The interface uses an Etsy-style modal for location and currency selection.

## How It Works

### 1. **First Visit Detection**
- When a user first visits the site, the `LocationProvider` automatically calls the IPinfo API
- Location data is stored in localStorage with a 24-hour cache
- Currency is automatically set based on the detected country
- The footer button shows "Detecting..." during the process

### 2. **Caching Strategy**
- **Anonymous users**: Data stored in localStorage for 24 hours
- **Logged-in users**: Data stored in both localStorage and database
- **API calls**: Only made once per 24 hours per user
- **Zustand store**: Manages state with persistence middleware

### 3. **User Experience**
- **Footer button**: Shows detected country and currency (e.g., "United States USD")
- **Modal interface**: Click the footer button to open location/currency selection
- **Automatic detection**: Works silently in the background
- **Manual override**: Users can change country/currency via the modal

## Components

### Core Files

#### `hooks/useLocation.ts`
- Main location store using Zustand with persist middleware
- Handles caching and API calls to `/api/location/preferences`
- Manages `locationPreferences`, `currentCountry`, `currentCurrency` state
- Includes `detectLocation()`, `setCountry()`, `setCurrency()` actions

#### `components/LocationModal.tsx`
- Etsy-style modal for country and currency selection
- Shows current detected location with green checkmark
- Filters countries to only show those with supported currencies
- Syncs with both location and currency stores

#### `components/providers/LocationProvider.tsx`
- Automatically detects location on app load
- Syncs location store currency with currency store
- Runs silently in the background without showing UI
- Logs analytics data for fraud detection

#### `app/api/location/preferences/route.ts`
- Handles IPinfo API calls with proper error handling
- Updates user preferences in database for logged-in users
- Stores fraud detection data (`signupIP`, `signupLocation`, etc.)
- Returns both location preferences and analytics data

#### `hooks/useCurrency.ts`
- Separate currency store for price formatting
- Integrates with currency conversion API
- Handles price formatting with proper decimals and symbols

### Data Flow

1. **App Load** → `LocationProvider` in root layout triggers detection
2. **API Call** → `/api/location/preferences` calls IPinfo API
3. **Storage** → Data saved to Zustand store + localStorage + database (if logged in)
4. **UI Update** → Footer button shows detected country/currency
5. **Price Display** → All prices automatically converted via `useCurrency` hook

## Supported Countries & Currencies

The system supports countries that have currencies available in the `SUPPORTED_CURRENCIES` array:

- **USD** - United States
- **EUR** - European Union countries  
- **GBP** - United Kingdom
- **CAD** - Canada
- **AUD** - Australia
- **JPY** - Japan
- **INR** - India
- **SGD** - Singapore

Countries are filtered in the modal to only show those with supported currencies.

## User Preferences

### Anonymous Users
- Location detected automatically via `LocationProvider`
- Preferences stored in localStorage with 24-hour expiry
- Lost when browser data is cleared
- Can manually override via modal

### Logged-in Users
- Location detected and stored in database
- `preferredCurrency` field updated in User model
- `signupIP` and `signupLocation` tracked for fraud detection
- `lastLoginIP` and `lastLoginAt` updated on each visit
- Preferences persist across devices

## Fraud Detection

The system includes comprehensive fraud detection:
- **IP Tracking**: `signupIP`, `lastLoginIP` fields
- **Location Tracking**: `signupLocation`, `buyerLocation` in orders
- **VPN Detection**: Checks for proxy/VPN indicators in IPinfo data
- **Analytics**: Stores device fingerprinting and activity logs
- **Risk Scoring**: `fraudScore`, `accountReputation` fields

## API Rate Limiting

- **IPinfo API**: Cached for 24 hours per user
- **Currency Conversion**: Built-in rate limiting (8 requests/minute)
- **Database Updates**: Batched to reduce load
- **Error Handling**: Graceful fallbacks to USD

## Error Handling

- **Detection Failure**: Falls back to USD/US location
- **API Errors**: Shows error states in UI with retry options
- **Network Issues**: Uses cached data when available
- **Debug Logging**: Console logs for troubleshooting

## Known Issues & Debugging

### Current Issues
- Footer button may show "Select location" even when detection works
- `currentCountry` getter returns null despite `locationPreferences` being set
- Zustand persist middleware may cause hydration issues

### Debug Steps
1. Check browser console for "currentCountry getter called with: null"
2. Verify `/api/location/preferences` returns 200 status
3. Check localStorage for cached location data
4. Clear localStorage to test fresh detection

## Testing

To test the system:

1. **Fresh Detection**: Clear localStorage and reload page
2. **Cached Data**: Reload page to test cached detection
3. **Modal Functionality**: Click footer button to open modal
4. **Country Selection**: Change country in modal
5. **Currency Selection**: Change currency independently
6. **Persistence**: Check that changes persist across page reloads

## Environment Variables

Required environment variables:
- `IPINFO_TOKEN` - IPinfo API token for geolocation
- `FREE_CURRENCY_API_KEY` - Currency conversion API key

## Future Enhancements

1. **Geolocation API**: Use browser geolocation as backup
2. **Timezone Detection**: Auto-set timezone preferences  
3. **Language Detection**: Auto-set language based on location
4. **Shipping Zones**: Auto-select appropriate shipping options
5. **Tax Calculation**: Auto-calculate taxes based on location
6. **Fix UI Issues**: Resolve currentCountry getter problems 
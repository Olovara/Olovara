# States/Provinces Implementation

This document explains the comprehensive states/provinces system implemented for all countries that can onboard sellers on the platform.

## Overview

The states/provinces system provides:
- Complete state/province data for 16 countries that can onboard sellers
- TypeScript interfaces and helper functions
- React hooks for state management
- Reusable UI components
- API endpoints for future search functionality

## Countries with States/Provinces

The following countries have complete state/province data:

### North America
- **United States (US)** - 50 states + territories
- **Canada (CA)** - 10 provinces + 3 territories
- **Mexico (MX)** - 32 states

### Europe
- **Germany (DE)** - 16 federal states (Länder)
- **France (FR)** - 13 regions
- **United Kingdom (GB)** - 4 countries/regions
- **Italy (IT)** - 20 regions
- **Spain (ES)** - 17 autonomous communities
- **Switzerland (CH)** - 26 cantons
- **Norway (NO)** - 11 counties

### Asia
- **Japan (JP)** - 47 prefectures
- **Thailand (TH)** - 77 provinces
- **Singapore (SG)** - 1 region (city-state)

### Oceania
- **Australia (AU)** - 6 states + 2 territories
- **New Zealand (NZ)** - 16 regions

### South America
- **Brazil (BR)** - 26 states + 1 federal district

## Data Structure

### StateProvince Interface
```typescript
interface StateProvince {
  code: string;        // State/province code (e.g., "CA", "NY", "ON")
  name: string;        // Full name (e.g., "California", "New York", "Ontario")
  type: 'state' | 'province' | 'region' | 'territory' | 'district' | 'prefecture' | 'canton' | 'land' | 'county';
}
```

### CountryStates Interface
```typescript
interface CountryStates {
  countryCode: string;
  countryName: string;
  states: StateProvince[];
}
```

## Usage Examples

### 1. Basic State Selection

```typescript
import { useStates } from '@/hooks/use-states';

function MyComponent() {
  const { states, loading, hasStates } = useStates({ 
    countryCode: 'US' 
  });

  if (loading) return <div>Loading states...</div>;
  if (!hasStates) return <div>No states available</div>;

  return (
    <select>
      {states.map(state => (
        <option key={state.code} value={state.code}>
          {state.name}
        </option>
      ))}
    </select>
  );
}
```

### 2. Using the StateSelect Component

```typescript
import { StateSelect } from '@/components/ui/state-select';

function MyForm() {
  const [selectedState, setSelectedState] = useState('');

  return (
    <StateSelect
      countryCode="CA"
      value={selectedState}
      onValueChange={setSelectedState}
      placeholder="Select a province"
    />
  );
}
```

### 3. Country and State Selection

```typescript
import { CountryStateSelect } from '@/components/ui/state-select';

function MyForm() {
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');

  return (
    <CountryStateSelect
      countryValue={country}
      stateValue={state}
      onCountryChange={setCountry}
      onStateChange={setState}
    />
  );
}
```

### 4. State Validation

```typescript
import { useStateValidation } from '@/hooks/use-states';

function MyForm() {
  const { validateStateCode, isStateRequired } = useStateValidation('US');

  const handleSubmit = (formData) => {
    if (isStateRequired() && !validateStateCode(formData.state)) {
      // Show error: state is required and invalid
    }
  };
}
```

## API Endpoints

### GET /api/states
Returns states/provinces data with various query parameters:

```bash
# Get all countries with states
GET /api/states?all=true

# Get states for a specific country
GET /api/states?country=US

# Get specific state
GET /api/states?country=US&state=CA

# Get list of countries with states
GET /api/states
```

### POST /api/states/search
Search states/provinces across countries:

```bash
POST /api/states/search
Content-Type: application/json

{
  "query": "california",
  "countries": ["US", "CA"],
  "limit": 10
}
```

## Helper Functions

### Data Access
```typescript
import { 
  getStatesByCountry,
  getStateByCode,
  hasStates,
  getAllCountriesWithStates 
} from '@/data/states';

// Get all states for a country
const usStates = getStatesByCountry('US');

// Get specific state
const california = getStateByCode('US', 'CA');

// Check if country has states
const hasUSStates = hasStates('US'); // true

// Get all countries with states
const countries = getAllCountriesWithStates();
```

### React Hooks
```typescript
import { 
  useStates, 
  useAllCountriesStates, 
  useStateValidation 
} from '@/hooks/use-states';

// Basic state management
const { states, loading, hasStates } = useStates({ countryCode: 'US' });

// All countries with states
const { countriesStates, loading } = useAllCountriesStates();

// State validation
const { validateStateCode, isStateRequired } = useStateValidation('US');
```

## Future Search Functionality

The system is designed to support future buyer search functionality where users can:

1. **Search by Country and State**: Buyers can filter products by seller location
2. **Geographic Targeting**: Sellers can target specific regions
3. **Local Marketplace**: Create regional marketplaces within countries

### Example Search Implementation
```typescript
// Future implementation for buyer search
const searchByLocation = async (countryCode: string, stateCode?: string) => {
  const params = new URLSearchParams({
    country: countryCode,
    ...(stateCode && { state: stateCode })
  });
  
  const response = await fetch(`/api/products/search?${params}`);
  return response.json();
};
```

## Database Integration

The current `shopState` field in the seller info schema has been enhanced to work with the new states system. The field stores the state code (e.g., "CA", "NY") which can be used to:

1. Display the full state name
2. Validate state selection
3. Enable geographic filtering
4. Support future search functionality

## Benefits

1. **Comprehensive Coverage**: All 16 onboarding countries have complete state/province data
2. **Type Safety**: Full TypeScript support with proper interfaces
3. **Reusable Components**: Ready-to-use UI components for forms
4. **API Ready**: Endpoints for future search and filtering
5. **Extensible**: Easy to add more countries or modify existing data
6. **Performance**: Optimized data structures and caching
7. **User Experience**: Searchable dropdowns with proper validation

## Adding New Countries

To add states/provinces for a new country:

1. Add the state data to `data/states.ts`
2. Update the `COUNTRY_STATES` object
3. Add the country code to the `getOnboardingCountriesStates()` function
4. Test the API endpoints and UI components

## Testing

The system includes comprehensive TypeScript types and can be tested using:

```typescript
// Test state retrieval
const states = getStatesByCountry('US');
console.log(`US has ${states.length} states`);

// Test state validation
const isValid = getStateByCode('US', 'CA');
console.log('California is valid:', !!isValid);

// Test API endpoints
fetch('/api/states?country=US')
  .then(res => res.json())
  .then(data => console.log(data));
```

This implementation provides a solid foundation for geographic-based features and search functionality in your marketplace.

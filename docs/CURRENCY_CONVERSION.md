# Currency Conversion System Documentation

## Overview

The Yarnnu marketplace implements a highly optimized multi-currency conversion system that supports real-time price conversion for products across 45+ supported currencies. The system uses intelligent caching, batching, and rate limiting to ensure fast performance even with hundreds of products.

## Table of Contents

1. [Architecture](#architecture)
2. [Supported Currencies](#supported-currencies)
3. [API Endpoints](#api-endpoints)
4. [Client-Side Usage](#client-side-usage)
5. [Performance Optimizations](#performance-optimizations)
6. [Caching Strategy](#caching-strategy)
7. [Rate Limiting](#rate-limiting)
8. [Error Handling](#error-handling)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

## Architecture

The currency conversion system consists of three main layers:

1. **Server-Side API** (`app/api/currency/convert/route.ts`)
   - Handles single and batch conversions
   - Manages exchange rate caching (in-memory + database)
   - Integrates with FreeCurrencyAPI for live rates

2. **Client-Side Hooks** (`hooks/useCurrency.ts`, `hooks/useBatchCurrency.ts`)
   - Provides React hooks for currency conversion
   - Implements client-side caching with TTL
   - Supports batch operations for product listings

3. **Exchange Rate Storage** (Prisma `ExchangeRate` model)
   - Persistent storage of exchange rates
   - 1-hour cache window in database
   - Automatic updates when rates expire

## Supported Currencies

The system supports 45+ currencies including:

- **Major Currencies**: USD, EUR, GBP, CAD, AUD, JPY, INR, SGD
- **European**: CHF, DKK, NOK, SEK, CZK, HUF, BGN, RON, GIP
- **Asian**: HKD, THB, MYR, IDR
- **Oceania**: NZD
- **South American**: BRL, MXN
- **African**: ZAR, GHS, KES, NGN, XOF
- **Middle East**: AED

See `data/units.ts` for the complete list of supported currencies with their decimal precision and symbols.

## API Endpoints

### Single Conversion

**Endpoint**: `POST /api/currency/convert`

**Request Body**:
```json
{
  "amount": 1000,
  "fromCurrency": "USD",
  "toCurrency": "EUR",
  "isCents": true
}
```

**Response**:
```json
{
  "convertedAmount": 920
}
```

**Example Usage**:
```typescript
const response = await fetch('/api/currency/convert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 1000,
    fromCurrency: 'USD',
    toCurrency: 'EUR',
    isCents: true
  })
});

const { convertedAmount } = await response.json();
```

### Batch Conversion

**Endpoint**: `POST /api/currency/convert`

**Request Body**:
```json
{
  "conversions": [
    { "amount": 1000, "fromCurrency": "USD", "toCurrency": "EUR", "isCents": true },
    { "amount": 2000, "fromCurrency": "USD", "toCurrency": "EUR", "isCents": true },
    { "amount": 3000, "fromCurrency": "USD", "toCurrency": "EUR", "isCents": true }
  ]
}
```

**Response**:
```json
{
  "convertedAmounts": [920, 1840, 2760]
}
```

**Benefits of Batch Conversion**:
- Reduces API calls from N to 1 (where N = number of products)
- Groups conversions by base currency for efficiency
- Fetches exchange rates once per currency group
- Perfect for product listings with hundreds of items

## Client-Side Usage

### Basic Usage with `useCurrency` Hook

```typescript
import { useCurrency } from '@/hooks/useCurrency';

function ProductCard({ product }) {
  const { formatPrice, currency } = useCurrency();
  const [formattedPrice, setFormattedPrice] = useState('');

  useEffect(() => {
    formatPrice(product.price, true) // true = price is in cents
      .then(setFormattedPrice);
  }, [product.price, formatPrice]);

  return <div>{formattedPrice}</div>;
}
```

### Batch Conversion for Product Listings

```typescript
import { useBatchCurrency } from '@/hooks/useBatchCurrency';

function ProductList({ products }) {
  const { getConvertedPrice, isLoading } = useBatchCurrency(products);

  if (isLoading) return <div>Loading prices...</div>;

  return (
    <div>
      {products.map((product, index) => (
        <div key={product.id}>
          {getConvertedPrice(index)}
        </div>
      ))}
    </div>
  );
}
```

### Programmatic Batch Conversion

```typescript
import { useCurrency } from '@/hooks/useCurrency';

function MyComponent() {
  const { batchFormatPrices } = useCurrency();

  const convertMultiplePrices = async () => {
    const amounts = [1000, 2000, 3000]; // prices in cents
    const formatted = await batchFormatPrices(amounts, 'USD', true);
    // Returns: ['$10.00', '$20.00', '$30.00'] (in user's selected currency)
  };
}
```

## Performance Optimizations

### 1. Server-Side In-Memory Cache

- **Location**: `app/api/currency/convert/route.ts`
- **TTL**: 1 hour (60 minutes)
- **Purpose**: Avoids database queries for frequently accessed exchange rates
- **Implementation**: `ExchangeRateCache` class with automatic expiration

```typescript
// Exchange rates are cached in memory after first fetch
// Subsequent requests for the same base currency return instantly
const rates = await getExchangeRates('USD'); // First call: fetches from DB/API
const rates2 = await getExchangeRates('USD'); // Second call: returns from cache
```

### 2. Database Cache Layer

- **Storage**: Prisma `ExchangeRate` model
- **TTL**: 1 hour
- **Purpose**: Persists rates across server restarts
- **Update Strategy**: Only fetches new rates when cache expires

### 3. Client-Side Cache

- **Location**: `hooks/useCurrency.ts`
- **TTL**: 5 minutes
- **Purpose**: Reduces redundant API calls for same conversions
- **Cache Key**: `amount_fromCurrency_toCurrency_isCents`

```typescript
// First conversion: API call
await convertPrice(1000, 'USD', 'EUR', true);

// Second conversion (within 5 min): Returns from cache
await convertPrice(1000, 'USD', 'EUR', true);
```

### 4. Batch Processing

- **Optimization**: Groups conversions by base currency
- **Benefit**: Fetches exchange rates once per currency group
- **Use Case**: Product listings with multiple products

**Before Optimization**:
```
100 products = 100 API calls = 100 database queries = 100 exchange rate fetches
```

**After Optimization**:
```
100 products = 1 batch API call = 1 database query = 1 exchange rate fetch
```

## Caching Strategy

### Cache Hierarchy

1. **Client-Side Cache** (5 min TTL)
   - Fastest access
   - Cleared on currency change
   - Per-conversion caching

2. **Server In-Memory Cache** (1 hour TTL)
   - Very fast access
   - Shared across all requests
   - Per-base-currency caching

3. **Database Cache** (1 hour TTL)
   - Fast access
   - Persistent across restarts
   - Per-base-currency caching

4. **External API** (FreeCurrencyAPI)
   - Slowest access
   - Rate limited (8 requests/minute)
   - Only used when all caches miss

### Cache Invalidation

- **Client Cache**: Cleared when user changes currency
- **Server Cache**: Automatic expiration after TTL
- **Database Cache**: Updated when rates are older than 1 hour

## Rate Limiting

### External API Rate Limits

- **Limit**: 8 requests per minute
- **Implementation**: `RateLimiter` class in API route
- **Behavior**: Returns error with wait time if limit exceeded

```typescript
// Rate limiter prevents exceeding FreeCurrencyAPI limits
if (!rateLimiter.canMakeRequest()) {
  const waitTime = rateLimiter.getTimeUntilNextRequest();
  throw new Error(`Rate limit exceeded. Please try again in ${Math.ceil(waitTime / 1000)} seconds.`);
}
```

### Mitigation Strategies

1. **Caching**: Reduces need for external API calls
2. **Batching**: Minimizes number of API calls
3. **Database Storage**: Serves stale rates if API unavailable

## Error Handling

### API Error Responses

**Missing Parameters**:
```json
{
  "error": "Missing required parameters",
  "status": 400
}
```

**Unsupported Currency**:
```json
{
  "error": "Unsupported currency",
  "status": 400
}
```

**Rate Limit Exceeded**:
```json
{
  "error": "Rate limit exceeded. Please try again in X seconds.",
  "status": 500
}
```

### Client-Side Error Handling

```typescript
try {
  const converted = await convertPrice(1000, 'USD', 'EUR', true);
} catch (error) {
  // Fallback: return original amount
  console.error('Conversion failed:', error);
  return isCents ? amount : amount * 100;
}
```

### Fallback Behavior

- **Conversion Failure**: Returns original amount in original currency
- **API Unavailable**: Uses cached rates from database
- **Cache Miss**: Falls back to database, then API

## Testing

### Testing Currency Conversion

```typescript
// Test single conversion
const response = await fetch('/api/currency/convert', {
  method: 'POST',
  body: JSON.stringify({
    amount: 1000,
    fromCurrency: 'USD',
    toCurrency: 'EUR',
    isCents: true
  })
});

// Test batch conversion
const batchResponse = await fetch('/api/currency/convert', {
  method: 'POST',
  body: JSON.stringify({
    conversions: [
      { amount: 1000, fromCurrency: 'USD', toCurrency: 'EUR', isCents: true },
      { amount: 2000, fromCurrency: 'USD', toCurrency: 'EUR', isCents: true }
    ]
  })
});
```

### Testing Cache Behavior

```typescript
// First call: should hit API/database
const start1 = Date.now();
await convertPrice(1000, 'USD', 'EUR', true);
const time1 = Date.now() - start1;

// Second call: should hit cache (much faster)
const start2 = Date.now();
await convertPrice(1000, 'USD', 'EUR', true);
const time2 = Date.now() - start2;

console.log(`First call: ${time1}ms, Second call: ${time2}ms`);
// Expected: time2 << time1
```

## Troubleshooting

### Issue: Slow Conversion Performance

**Symptoms**: Conversions taking several seconds

**Solutions**:
1. Check if batch conversion is being used for multiple products
2. Verify cache is working (check server logs for cache hits)
3. Ensure database has recent exchange rates
4. Check FreeCurrencyAPI rate limits

### Issue: Stale Exchange Rates

**Symptoms**: Prices seem incorrect compared to current rates

**Solutions**:
1. Exchange rates update automatically every hour
2. Manually clear cache by restarting server
3. Check `ExchangeRate` table `lastUpdated` field
4. Verify FreeCurrencyAPI is responding correctly

### Issue: Rate Limit Errors

**Symptoms**: "Rate limit exceeded" errors

**Solutions**:
1. Implement batch conversion to reduce API calls
2. Increase cache TTL to reduce external API usage
3. Check if multiple servers are sharing same API key
4. Wait for rate limit window to reset (1 minute)

### Issue: Currency Not Converting

**Symptoms**: Price shows in original currency

**Solutions**:
1. Verify currency is in `SUPPORTED_CURRENCIES` list
2. Check browser console for conversion errors
3. Verify API endpoint is accessible
4. Check network tab for failed requests

## Best Practices

1. **Use Batch Conversion for Lists**: Always use `useBatchCurrency` or `batchFormatPrices` for product listings
2. **Handle Loading States**: Show loading indicators while conversions are in progress
3. **Cache Currency Selection**: Store user's currency preference in localStorage (handled by `useCurrency` hook)
4. **Error Fallbacks**: Always provide fallback to original currency if conversion fails
5. **Monitor Rate Limits**: Track API usage to avoid hitting rate limits

## Environment Variables

Required environment variable:

```env
FREE_CURRENCY_API_KEY=your_api_key_here
```

Get your API key from [FreeCurrencyAPI](https://freecurrencyapi.com/).

## Related Files

- **API Route**: `app/api/currency/convert/route.ts`
- **Client Hook**: `hooks/useCurrency.ts`
- **Batch Hook**: `hooks/useBatchCurrency.ts`
- **Currency Data**: `data/units.ts`
- **Database Schema**: `prisma/schema.prisma` (ExchangeRate model)

## Future Enhancements

Potential improvements for the currency conversion system:

1. **WebSocket Updates**: Real-time exchange rate updates
2. **Historical Rates**: Support for historical price conversions
3. **Currency Preferences**: Per-user currency preferences
4. **Multi-Currency Products**: Support products priced in multiple currencies
5. **Rate Alerts**: Notify users of significant rate changes


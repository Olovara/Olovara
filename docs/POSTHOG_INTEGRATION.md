# PostHog Analytics Integration

This document explains how PostHog analytics is integrated into your Yarnnu marketplace and how to use it effectively.

## Setup

### Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com  # or your self-hosted instance
```

### What's Already Integrated

1. **Automatic Page View Tracking**: Every page navigation is automatically tracked
2. **Session Recording**: User sessions are recorded for analysis
3. **Autocapture**: Clicks, form submissions, and other interactions are automatically captured
4. **User Identification**: Users are identified when they log in

## Usage Examples

### Basic Event Tracking

```tsx
import { useAnalytics } from '@/hooks/use-posthog'

function MyComponent() {
  const { track } = useAnalytics()
  
  const handleButtonClick = () => {
    track('button_clicked', {
      button_name: 'checkout',
      page: 'product_detail'
    })
  }
  
  return <button onClick={handleButtonClick}>Checkout</button>
}
```

### Marketplace-Specific Tracking

```tsx
import { useMarketplaceAnalytics } from '@/hooks/use-posthog'

function ProductCard({ product }) {
  const { trackProductView, trackAddToCart } = useMarketplaceAnalytics()
  
  useEffect(() => {
    // Track when product is viewed
    trackProductView(product.id, product.name, product.category)
  }, [product.id])
  
  const handleAddToCart = () => {
    trackAddToCart(product.id, product.name, product.price)
    // Your add to cart logic here
  }
  
  return (
    <div>
      <h3>{product.name}</h3>
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  )
}
```

### User Identification

```tsx
import { useAnalytics } from '@/hooks/use-posthog'

function UserProfile({ user }) {
  const { identify, setUserProperties } = useAnalytics()
  
  useEffect(() => {
    if (user) {
      // Identify the user
      identify(user.id, {
        email: user.email,
        role: user.role,
        join_date: user.createdAt
      })
      
      // Set additional properties
      setUserProperties({
        preferred_categories: user.preferences?.categories,
        total_orders: user.orderCount
      })
    }
  }, [user])
  
  return <div>User Profile</div>
}
```

### Using the ProductAnalytics Component

```tsx
import { ProductAnalytics } from '@/components/analytics/ProductAnalytics'

function ProductPage({ product, user }) {
  return (
    <div>
      {/* This component automatically tracks product views */}
      <ProductAnalytics
        productId={product.id}
        productName={product.name}
        category={product.category}
        price={product.price}
        userId={user?.id}
        userRole={user?.role}
      />
      
      <h1>{product.name}</h1>
      {/* Your product page content */}
    </div>
  )
}
```

## Available Tracking Functions

### General Analytics (`useAnalytics`)
- `track(event, properties)` - Track custom events
- `identify(userId, properties)` - Identify users
- `setUserProperties(properties)` - Set user properties
- `getFeatureFlag(flagKey)` - Get feature flag values
- `trackPageView(url)` - Track page views manually
- `trackUserAction(action, properties)` - Track user actions

### Marketplace Analytics (`useMarketplaceAnalytics`)
- `trackProductView(productId, productName, category)` - Track product views
- `trackAddToCart(productId, productName, price)` - Track add to cart events
- `trackPurchase(orderId, total, items)` - Track completed purchases
- `trackSearch(query, resultsCount)` - Track search queries
- `trackSellerAction(action, sellerId, properties)` - Track seller actions

## Key Events to Track

### User Journey Events
- `user_registered` - When a user creates an account
- `user_logged_in` - When a user logs in
- `user_logged_out` - When a user logs out
- `profile_updated` - When user updates their profile

### Product Events
- `product_viewed` - When a product is viewed
- `product_added_to_cart` - When a product is added to cart
- `product_removed_from_cart` - When a product is removed from cart
- `product_favorited` - When a product is favorited
- `product_shared` - When a product is shared

### Purchase Events
- `checkout_started` - When checkout process begins
- `payment_method_selected` - When payment method is chosen
- `purchase_completed` - When purchase is completed
- `purchase_failed` - When purchase fails

### Seller Events
- `seller_application_submitted` - When seller applies
- `seller_application_approved` - When seller is approved
- `product_created` - When seller creates a product
- `product_updated` - When seller updates a product
- `order_received` - When seller receives an order

### Search & Discovery
- `search_performed` - When user searches
- `filter_applied` - When filters are applied
- `category_viewed` - When category page is viewed
- `shop_viewed` - When shop page is viewed

## Best Practices

1. **Be Consistent**: Use the same event names and property keys across your app
2. **Include Context**: Always include relevant properties like `product_id`, `user_id`, `page`, etc.
3. **Use Descriptive Names**: Event names should clearly describe what happened
4. **Track User Journey**: Track the complete user journey from registration to purchase
5. **Respect Privacy**: Don't track sensitive information like passwords or personal details
6. **Test in Development**: Use the development console to verify events are being sent

## Debugging

In development mode, PostHog initialization is logged to the console. You can also:

1. Open browser dev tools
2. Go to Network tab
3. Filter by "posthog" to see API calls
4. Check the PostHog dashboard to see events in real-time

## Privacy Considerations

- PostHog automatically respects Do Not Track settings
- Session recordings can be disabled per user
- Personal data is handled according to your privacy policy
- Users can opt out of analytics tracking

## Next Steps

1. Set up your PostHog project and get your API key
2. Add the environment variables
3. Start tracking key user interactions
4. Set up funnels to analyze user journeys
5. Create dashboards to monitor key metrics
6. Use feature flags for A/B testing 
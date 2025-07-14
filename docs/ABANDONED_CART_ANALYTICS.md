# Abandoned Cart Analytics System

## Overview

The abandoned cart analytics system provides comprehensive tracking and analysis of user behavior during the checkout process. This system helps identify why users abandon their carts and provides insights for conversion optimization.

## Key Benefits

### 1. **Detailed User Journey Tracking**
- Track every step of the checkout process
- Monitor form field interactions
- Record time spent on each step
- Capture abandonment reasons

### 2. **Conversion Optimization Insights**
- Identify friction points in checkout
- Understand user behavior patterns
- Optimize checkout flow based on data
- Reduce cart abandonment rates

### 3. **Recovery Opportunities**
- Store abandoned cart data for recovery campaigns
- Send targeted recovery emails
- Track recovery success rates
- Personalize recovery messaging

## System Architecture

### Frontend Tracking
- **Real-time tracking**: Monitor user activity during checkout
- **Step-by-step analysis**: Track completion of each checkout step
- **Form interaction tracking**: Monitor which fields users interact with
- **Abandonment detection**: Detect when users leave the checkout process

### Backend Storage
- **Database persistence**: Store detailed analytics in MongoDB
- **API endpoints**: RESTful APIs for saving and retrieving data
- **Analytics aggregation**: Generate insights and reports

### Analytics Integration
- **PostHog integration**: Real-time event tracking
- **Custom events**: Track specific checkout behaviors
- **Funnel analysis**: Analyze conversion funnels
- **A/B testing support**: Test checkout optimizations

## Implementation Details

### 1. Abandoned Cart Hook (`useAbandonedCart`)

```typescript
const {
  startTracking,
  completeStep,
  abandonCart,
  completeCheckout,
  trackError,
  isTracking,
  currentStep,
  steps,
  timeSpent,
  sessionId
} = useAbandonedCart(cartData);
```

**Features:**
- Automatic activity tracking
- Inactivity detection (5-minute timeout)
- Page unload detection
- Scroll depth tracking
- Database persistence

### 2. Form Tracking Hook (`useFormTracking`)

```typescript
const {
  trackFieldInteraction,
  trackFormError,
  trackFormComplete,
  fieldInteractions
} = useFormTracking('shipping_address', cartData);
```

**Features:**
- Field-level interaction tracking
- Form validation error tracking
- Completion tracking
- Field interaction analytics

### 3. Checkout Step Tracking

```typescript
const { markStepComplete, markStepError } = useCheckoutStep('quantity_selection', cartData);
```

**Features:**
- Step completion tracking
- Error tracking per step
- Step timing analysis
- Progress monitoring

## Data Collection

### Cart Data Structure

```typescript
interface CartData {
  productId: string;
  productName: string;
  price: number; // In cents
  quantity: number;
  total: number; // In cents
  isDigital: boolean;
  sellerId?: string;
  discountCode?: string;
  discountAmount?: number;
}
```

### Abandoned Cart Record

```typescript
interface AbandonedCart {
  id: string;
  sessionId: string;
  userId?: string;
  
  // Product information
  productId: string;
  productName: string;
  price: number; // In cents
  quantity: number;
  total: number; // In cents
  isDigital: boolean;
  sellerId?: string;
  
  // Checkout progress
  stepsCompleted: string[];
  lastStep?: string;
  timeSpent: number; // In seconds
  abandonmentReason?: string;
  
  // User behavior
  fieldInteractions: string[];
  pageViews: number;
  scrollDepth?: number; // Percentage
  
  // Technical details
  userAgent?: string;
  ipAddress?: string;
  location?: Json;
  deviceType?: string;
  
  // Recovery tracking
  recoveryEmailsSent: number;
  lastRecoveryEmail?: DateTime;
  recovered: boolean;
  recoveredAt?: DateTime;
  
  // Metadata
  metadata?: Json;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

## Tracked Events

### 1. Checkout Events
- `checkout_started`: User begins checkout process
- `checkout_step_completed`: User completes a checkout step
- `checkout_abandoned`: User abandons checkout
- `checkout_completed`: User successfully completes checkout
- `checkout_error`: Error occurs during checkout

### 2. Form Events
- `form_field_interaction`: User interacts with form field
- `form_validation_error`: Form validation fails
- `form_completed`: Form is successfully completed

### 3. User Behavior Events
- `page_view`: User views checkout page
- `scroll_depth`: User scrolls through page
- `inactivity_timeout`: User becomes inactive
- `page_unload`: User leaves page

## Abandonment Reasons

### Automatic Detection
- `inactivity`: User inactive for 5+ minutes
- `page_unload`: User closes tab/window
- `page_navigation`: User navigates away
- `component_unmount`: React component unmounts

### Manual Tracking
- `authentication_required`: User needs to sign in
- `shipping_restriction`: Shipping not available
- `api_error`: API call fails
- `network_error`: Network connection issues
- `form_validation`: Form validation errors

## Analytics Dashboard

### Key Metrics

1. **Abandonment Rate**
   ```
   Abandonment Rate = (Abandoned Carts / Total Checkout Sessions) × 100
   ```

2. **Recovery Rate**
   ```
   Recovery Rate = (Recovered Carts / Total Abandoned Carts) × 100
   ```

3. **Average Time to Abandonment**
   ```
   Average Time = Sum(Time Spent) / Number of Abandoned Carts
   ```

4. **Step Completion Rate**
   ```
   Step Rate = (Sessions Completing Step / Total Sessions) × 100
   ```

### Insights Available

1. **Top Abandonment Reasons**
   - Most common reasons for abandonment
   - Trends over time
   - Seasonal patterns

2. **Product Performance**
   - Products with highest abandonment rates
   - Price sensitivity analysis
   - Digital vs physical product comparison

3. **User Behavior Patterns**
   - Device type preferences
   - Geographic patterns
   - Time of day analysis

4. **Form Optimization**
   - Most problematic form fields
   - Field interaction patterns
   - Validation error frequency

## Recovery Strategies

### 1. Email Recovery Campaigns
- Send recovery emails to abandoned cart users
- Personalize based on product and behavior
- Track email effectiveness

### 2. Retargeting Campaigns
- Use abandoned cart data for ad retargeting
- Create custom audiences
- A/B test different messaging

### 3. On-Site Recovery
- Show abandoned cart reminders
- Offer incentives to complete purchase
- Simplify checkout process

## API Endpoints

### Save Abandoned Cart
```http
POST /api/analytics/abandoned-cart
Content-Type: application/json

{
  "sessionId": "cart_1234567890_abc123",
  "productId": "product_123",
  "productName": "Handmade Scarf",
  "price": 29.99,
  "quantity": 1,
  "total": 34.99,
  "isDigital": false,
  "sellerId": "seller_456",
  "stepsCompleted": ["quantity_selected", "discount_applied"],
  "lastStep": "shipping_address",
  "timeSpent": 180,
  "abandonmentReason": "page_unload",
  "fieldInteractions": ["name", "street", "city"],
  "pageViews": 1,
  "scrollDepth": 75.5,
  "metadata": {
    "discountCode": "SAVE10",
    "discountAmount": 5.00
  }
}
```

### Get Analytics (Admin Only)
```http
GET /api/analytics/abandoned-cart?days=30&limit=100
```

**Response:**
```json
{
  "abandonedCarts": [...],
  "summary": {
    "totalAbandoned": 150,
    "totalRecovered": 25,
    "recoveryRate": 16.67,
    "periodDays": 30
  },
  "abandonmentReasons": [
    {
      "abandonmentReason": "page_unload",
      "_count": { "abandonmentReason": 45 }
    }
  ],
  "topAbandonedProducts": [
    {
      "productId": "product_123",
      "productName": "Handmade Scarf",
      "_count": { "productId": 12 },
      "_sum": { "total": 419.88 }
    }
  ]
}
```

## Integration Examples

### 1. Checkout Page Integration

```typescript
// In checkout page component
const {
  startTracking,
  completeStep,
  abandonCart,
  completeCheckout,
  trackError
} = useAbandonedCart(cartData);

const {
  trackFieldInteraction,
  trackFormError,
  trackFormComplete
} = useFormTracking('shipping_address', cartData);

// Start tracking when component mounts
useEffect(() => {
  if (product && !isTracking) {
    startTracking();
  }
}, [product, startTracking, isTracking]);

// Track form interactions
const handleAddressChange = (e) => {
  const { name, value } = e.target;
  setShippingAddress(prev => ({ ...prev, [name]: value }));
  trackFieldInteraction(name);
};

// Track successful checkout
const handleContinue = async () => {
  if (validate()) {
    trackFormComplete(shippingAddress);
    completeStep('form_validated');
    
    try {
      const response = await createPaymentIntent(data);
      if (response.ok) {
        completeStep('payment_intent_created');
        completeCheckout();
        window.location.href = response.data.url;
      }
    } catch (error) {
      trackError('api_error', error.message);
    }
  }
};
```

### 2. Form Field Tracking

```typescript
// Track individual form fields
<Input
  name="name"
  placeholder="Full Name"
  value={shippingAddress.name}
  onChange={handleAddressChange}
  onFocus={() => trackFieldInteraction('name')}
  onBlur={() => {
    if (!shippingAddress.name) {
      trackFormError('name', 'Required field missing');
    }
  }}
/>
```

### 3. Error Tracking

```typescript
// Track validation errors
const validate = () => {
  if (!quantity || quantity < 1) {
    trackFormError('quantity', 'Invalid quantity');
    return false;
  }
  
  if (!shippingAddress.name) {
    trackFormError('name', 'Required field missing');
    return false;
  }
  
  return true;
};
```

## Best Practices

### 1. Privacy Compliance
- Only track necessary data
- Respect user privacy preferences
- Comply with GDPR/CCPA requirements
- Anonymize sensitive information

### 2. Performance Optimization
- Use debounced tracking for frequent events
- Batch database writes when possible
- Implement proper error handling
- Monitor API performance

### 3. Data Quality
- Validate all incoming data
- Handle missing or invalid data gracefully
- Implement data retention policies
- Regular data cleanup

### 4. Analytics Accuracy
- Use consistent event naming
- Include relevant context in events
- Track both success and failure paths
- Validate tracking implementation

## Troubleshooting

### Common Issues

1. **Events Not Tracking**
   - Check PostHog configuration
   - Verify network connectivity
   - Check browser console for errors

2. **Database Errors**
   - Verify Prisma schema is up to date
   - Check database connectivity
   - Validate data types

3. **Performance Issues**
   - Monitor API response times
   - Check database query performance
   - Optimize tracking frequency

### Debug Mode

Enable debug logging in development:

```typescript
// In development environment
if (process.env.NODE_ENV === 'development') {
  console.log('Abandoned cart tracking:', {
    sessionId,
    currentStep,
    timeSpent,
    stepsCompleted
  });
}
```

## Future Enhancements

### Planned Features

1. **Machine Learning Integration**
   - Predictive abandonment scoring
   - Personalized recovery strategies
   - Dynamic checkout optimization

2. **Advanced Analytics**
   - Cohort analysis
   - User segmentation
   - Behavioral scoring

3. **Real-time Dashboards**
   - Live abandonment monitoring
   - Instant alert system
   - Performance metrics

4. **A/B Testing Framework**
   - Checkout flow testing
   - Recovery message testing
   - Pricing optimization

---

*This documentation covers the current implementation. For questions or issues, please refer to the troubleshooting section or contact the development team.* 
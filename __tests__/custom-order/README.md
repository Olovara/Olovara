# Custom Order Checkout Testing Guide

## Overview

This directory contains comprehensive tests for the custom order checkout process, including payment flows, webhook handling, and UI components. The tests use Stripe's test mode to ensure reliable and safe testing.

## Test Structure

```
__tests__/custom-order/
├── checkout.test.ts                    # API route tests
├── components/
│   ├── CustomOrderPaymentButton.test.tsx  # Payment button component tests
│   └── SetPaymentAmountsForm.test.tsx     # Seller payment form tests
└── README.md                           # This file
```

## Testing Strategy

### 1. Unit Tests (Mocked)
- **API Routes**: Test payment session creation and webhook handling
- **Components**: Test UI interactions and form validation
- **Server Actions**: Test business logic and data validation

### 2. Integration Tests (Real Stripe Test Mode)
- End-to-end payment flows
- Webhook processing
- Database state changes

### 3. Test Data Factories
- Consistent mock data for all test scenarios
- Easy to modify and extend

## Running Tests

### Unit Tests (Fast)
```bash
# Run all custom order tests
yarn test __tests__/custom-order/

# Run specific test file
yarn test checkout.test.ts

# Run with coverage
yarn test __tests__/custom-order/ --coverage
```

### Integration Tests (Requires Stripe Test Keys)
```bash
# Set up test environment
export STRIPE_SECRET_KEY=sk_test_...
export STRIPE_WEBHOOK_SECRET=whsec_test_...

# Run integration tests
yarn test __tests__/custom-order/ --testNamePattern="integration"
```

## Test Scenarios Covered

### Payment Session Creation
- ✅ Materials deposit payment session
- ✅ Final payment session
- ✅ Currency conversion
- ✅ Authentication validation
- ✅ Authorization checks
- ✅ Error handling

### Webhook Processing
- ✅ Successful payment processing
- ✅ Payment failure handling
- ✅ Database updates
- ✅ Payment record creation
- ✅ Status transitions

### UI Components
- ✅ Payment button rendering
- ✅ Form validation
- ✅ Loading states
- ✅ Error handling
- ✅ Currency formatting

## Stripe Test Mode Setup

### 1. Test API Keys
Use Stripe's test mode keys (prefixed with `sk_test_` and `pk_test_`):

```bash
# .env.test
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

### 2. Test Card Numbers
Use Stripe's test card numbers:

```javascript
// Successful payment
const SUCCESS_CARD = '4242424242424242'

// Declined payment
const DECLINED_CARD = '4000000000000002'

// Insufficient funds
const INSUFFICIENT_FUNDS_CARD = '4000000000009995'
```

### 3. Test Webhook Events
Use Stripe CLI to forward webhooks:

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/custom-order-webhooks

# Trigger test events
stripe trigger checkout.session.completed
```

## Mock Data Examples

### Custom Order Submission
```javascript
const createMockSubmission = (overrides = {}) => ({
  id: 'submission-123',
  formId: 'form-123',
  userId: 'user-123',
  customerEmail: 'customer@example.com',
  status: 'PENDING',
  materialsDepositAmount: 2500, // $25.00 in cents
  finalPaymentAmount: 7500, // $75.00 in cents
  totalAmount: 10000, // $100.00 in cents
  currency: 'USD',
  materialsDepositPaid: false,
  finalPaymentPaid: false,
  ...overrides,
})
```

### Stripe Session
```javascript
const createMockStripeSession = (overrides = {}) => ({
  id: 'cs_test_session_123',
  url: 'https://checkout.stripe.com/pay/cs_test_session_123',
  payment_intent: 'pi_test_payment_intent_123',
  amount_total: 2500,
  currency: 'usd',
  metadata: {
    submissionId: 'submission-123',
    paymentType: 'MATERIALS_DEPOSIT',
  },
  ...overrides,
})
```

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Clean up test data after each test
- Use unique IDs for test data

### 2. Mock External Dependencies
- Mock Stripe API calls in unit tests
- Use real Stripe API only in integration tests
- Mock database operations when testing business logic

### 3. Error Scenarios
- Test all error paths
- Verify error messages are user-friendly
- Test network failures and timeouts

### 4. Edge Cases
- Zero amounts
- Large amounts
- Invalid currencies
- Missing required fields
- Duplicate submissions

## Common Test Patterns

### Testing API Routes
```javascript
it('should create payment session', async () => {
  const request = new NextRequest('http://localhost:3000/api/stripe/custom-order-payment', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  })

  const response = await createPaymentSession(request)
  const responseData = await response.json()

  expect(responseData.url).toBe('https://checkout.stripe.com/pay/cs_test_session_123')
})
```

### Testing Components
```javascript
it('should handle payment initiation', async () => {
  render(<CustomOrderPaymentButton {...props} />)
  
  const button = screen.getByRole('button')
  fireEvent.click(button)

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith('/api/stripe/custom-order-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expectedData),
    })
  })
})
```

### Testing Webhooks
```javascript
it('should process successful payment', async () => {
  const mockEvent = {
    type: 'checkout.session.completed',
    data: { object: createMockStripeSession() },
  }

  const request = new NextRequest('http://localhost:3000/api/stripe/custom-order-webhooks', {
    method: 'POST',
    body: JSON.stringify(mockEvent),
  })

  const response = await handleWebhook(request)
  expect(response.status).toBe(200)
})
```

## Troubleshooting

### Common Issues

1. **Jest Mock Issues**
   ```bash
   # Clear Jest cache
   yarn jest --clearCache
   ```

2. **Stripe API Errors**
   ```bash
   # Verify test keys
   stripe balance --api-key sk_test_...
   ```

3. **Webhook Signature Errors**
   ```bash
   # Use correct webhook secret
   export STRIPE_WEBHOOK_SECRET=whsec_test_...
   ```

4. **Database Connection Issues**
   ```bash
   # Use test database
   export DATABASE_URL="mongodb://localhost:27017/olovara_test"
   ```

### Debug Mode
```bash
# Run tests with verbose output
yarn test --verbose

# Run specific test with debug
yarn test --testNamePattern="should create payment session" --verbose
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Custom Order Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: yarn install
      - run: yarn test __tests__/custom-order/
        env:
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_TEST_SECRET_KEY }}
          STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_TEST_WEBHOOK_SECRET }}
```

## Performance Considerations

### Test Execution Time
- Unit tests: < 1 second per test
- Integration tests: 2-5 seconds per test
- Full suite: < 30 seconds

### Memory Usage
- Mock external dependencies to reduce memory usage
- Clean up test data to prevent memory leaks
- Use test database for integration tests

## Security Notes

### Test Data
- Never use real payment data in tests
- Use Stripe's test mode exclusively
- Don't commit test API keys to version control

### Webhook Testing
- Use Stripe CLI for local webhook testing
- Verify webhook signatures in production
- Test webhook retry logic

## Future Enhancements

### Planned Test Improvements
- [ ] E2E tests with Playwright
- [ ] Performance testing
- [ ] Load testing for webhooks
- [ ] Accessibility testing
- [ ] Mobile responsiveness testing

### Test Coverage Goals
- API routes: 95%+
- Components: 90%+
- Business logic: 95%+
- Error handling: 100%

---

**Remember**: Always test in Stripe's test mode first, then verify in production with small amounts before going live. 
# Payment Processing Documentation

## Overview

The OLOVARA marketplace implements a comprehensive payment processing system with fraud prevention, seller protection, and secure digital delivery. This document covers all aspects of the payment flow, from checkout to seller payout.

## Table of Contents

1. [Authentication Requirements](#authentication-requirements)
2. [Payment Flow](#payment-flow)
3. [Seller Payout Hold Periods](#seller-payout-hold-periods)
4. [Digital Download Security](#digital-download-security)
5. [Refund Processing](#refund-processing)
6. [Guest Checkout](#guest-checkout)
7. [API Endpoints](#api-endpoints)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

## Authentication Requirements

### When Authentication is Required

The system enforces authentication in two scenarios:

1. **High-Value Orders**: Orders totaling $100 or more
2. **Digital Products**: Any digital item regardless of price

### Implementation

```typescript
// From app/api/stripe/create-payment-intent/route.ts
const totalOrderValue = (productPriceInDollars + shippingCostInDollars + handlingFeeInDollars) * quantity;
const requiresAuth = totalOrderValue >= 100 || product.isDigital;

if (requiresAuth && !session?.user) {
  return NextResponse.json({ 
    error: "Authentication required", 
    details: totalOrderValue >= 100 
      ? "Orders over $100 require a signed-in account for fraud prevention." 
      : "Digital items require a signed-in account for fraud prevention.",
    requiresAuth: true,
    orderValue: totalOrderValue,
    isDigital: product.isDigital
  }, { status: 401 });
}
```

### User Experience

When authentication is required:
1. User clicks "Buy Now"
2. System checks authentication requirements
3. If not authenticated, shows `AuthRequirementModal`
4. Modal explains why authentication is needed
5. User can sign in or create account
6. After authentication, checkout proceeds normally

## Payment Flow

### 1. Checkout Initiation

```typescript
// User clicks "Buy Now" → CheckoutButton component
const handleCheckout = async () => {
  const response = await fetch("/api/stripe/create-payment-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      productId, 
      quantity,
      preferredCurrency: currency 
    }),
  });
  
  if (response.ok && data.url) {
    window.location.href = data.url; // Redirect to Stripe Checkout
  }
};
```

### 2. Stripe Checkout Session Creation

The system creates a Stripe Checkout session with:
- Product details and pricing
- Shipping address collection
- Tax calculation
- Connected account transfer setup
- Metadata for order tracking

### 3. Payment Processing

1. Customer completes payment on Stripe
2. Stripe sends `checkout.session.completed` webhook
3. System processes the webhook and creates order
4. Calculates seller payout and hold period
5. Creates scheduled transfer to seller
6. Sends confirmation emails

### Payment Element / `create-payment-intent` (Separate charges and transfers)

**Duplicate protection**

- **Stripe**: Send a stable `Idempotency-Key` header (or `idempotencyKey` in the JSON body) on `POST /api/stripe/create-payment-intent`. The API forwards it to `paymentIntents.create`, so repeated requests return the same PaymentIntent instead of creating extra intents.
- **Database**: `Order.stripeSessionId` is **unique** (`cs_*` for Checkout Session, `pi_*` for Payment Element). Webhooks treat `P2002` as “another worker won the race” and load the existing row. **Before applying the unique index**, remove any duplicate `stripeSessionId` rows in MongoDB or `prisma db push` will fail.

Marketplace checkout via the Payment Element uses **separate charges and transfers**:

- Customer pays the platform (PaymentIntent on platform)
- Webhook waits for the finalized Stripe processing fee (`balance_transaction.fee`)
- Platform creates a `transfer` of \(amount − platformFee − stripeFee\) so the **seller pays Stripe fees**

This avoids estimating fees and prevents overpaying sellers when Stripe’s fee isn’t immediately available.

**Checkout performance & Stripe limits**

- **Currency**: Server routes call `convertCurrencyAmount` from `lib/currency-convert.ts` (same logic as `POST /api/currency/convert`) — no HTTP self-calls to your own origin.
- **Metadata**: Full shipping + buyer instructions are stored in **`CheckoutDraft`** (encrypted) before `paymentIntents.create`; metadata only carries `checkoutDraftId` (UUID). Legacy PIs may still have `shippingAddress` JSON in metadata.
- **Platform fee**: Computed as a percentage of **final charged amount after discounts** (not pre-discount subtotal).
- **Connect capabilities**: `Seller.stripeTransfersCapability` is updated on **`account.updated`**; checkout skips `accounts.retrieve` when the cached value is `active`.

## Seller Payout Hold Periods

### Hold Period Calculation

Hold periods are determined by seller trustworthiness:

```typescript
// From app/api/stripe/webhooks/route.ts
function calculateHoldPeriod(accountAgeInDays: number, seller: any): number {
  const isTrusted = seller.user?.accountReputation === "TRUSTED" && 
                   seller.user?.numChargebacks <= 1 && 
                   seller.user?.numDisputes <= 1;

  if (accountAgeInDays < 30) return 10; // New seller: 10 days
  if (isTrusted) return 1; // Trusted seller: 1 day
  return 7; // Not trusted: 7 days
}
```

### Hold Period Rules

| Seller Type | Account Age | Reputation | Hold Period |
|-------------|-------------|------------|-------------|
| New Seller | < 30 days | Any | 10 days |
| Trusted Seller | ≥ 30 days | Good | 1 day |
| Not Trusted | ≥ 30 days | Poor | 7 days |
| Digital Items | Any | Any | Min 2 days |

### Implementation

```typescript
// Determine hold period
const holdPeriodDays = await determineHoldPeriod(sellerId, isDigital);

// Create scheduled transfer
const transferParams = {
  amount: amountToSeller,
  currency: product.currency.toLowerCase(),
  destination: seller.connectedAccountId,
  delay_days: holdPeriodDays, // Stripe scheduled transfer
  metadata: {
    orderId: order.id,
    holdPeriodDays: holdPeriodDays.toString(),
    scheduledTransferDate: transferDate.toISOString(),
  },
};

const transfer = await stripeSecret.instance.transfers.create(transferParams);
```

## Digital Download Security

### Secure Download Implementation

Digital downloads are protected through a secure API endpoint:

```typescript
// From app/api/download/[productId]/route.ts
export async function GET(req: Request, { params }: { params: { productId: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find completed, paid order for this user and product
  const order = await db.order.findFirst({
    where: {
      userId: session.user.id,
      productId,
      isDigital: true,
      status: "COMPLETED",
      paymentStatus: "PAID",
      NOT: { status: "REFUNDED" }
    },
  });

  if (!order) {
    return NextResponse.json({ error: "No eligible order found" }, { status: 403 });
  }

  // Track download attempt
  await db.order.update({
    where: { id: order.id },
    data: {
      digitalDownloadAttempted: true,
      digitalDownloadedAt: new Date(),
    },
  });

  return NextResponse.redirect(order.product.productFile);
}
```

### Download Tracking Fields

The Order model includes fields for tracking downloads:

```prisma
model Order {
  // ... other fields
  
  // Digital download tracking
  digitalDownloadAttempted Boolean @default(false)
  digitalDownloadedAt      DateTime?
}
```

### Frontend Integration

Product pages link to the secure download endpoint:

```typescript
// From components/ProductDetails.tsx
{data.isDigital && data.productFile && (
  <div className="mt-8 bg-green-50 p-4 rounded-lg">
    <h3 className="text-lg font-semibold">Digital Download</h3>
    <a
      href={`/api/download/${data.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline hover:text-blue-800"
    >
      Download Now
    </a>
  </div>
)}
```

## Refund Processing

### Refund Policy

Digital products follow a strict refund policy:
- **Before download**: Full refund allowed
- **After download**: No refund allowed (prevents fraud)

### Refund Implementation

```typescript
// From lib/refund-policy.ts
export async function checkDigitalRefundEligibility(orderId: string): Promise<RefundDecision> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      isDigital: true,
      digitalDownloadAttempted: true,
      digitalDownloadedAt: true,
    },
  });

  if (!order.isDigital) {
    return { canRefund: true, reason: "Physical product - standard refund policy applies" };
  }

  if (order.digitalDownloadAttempted) {
    return { 
      canRefund: false, 
      reason: "Digital product has been downloaded - no refund allowed",
      downloadAttempted: true,
      downloadedAt: order.digitalDownloadedAt,
    };
  }

  return { canRefund: true, reason: "Digital product not downloaded - refund allowed" };
}
```

### Refund API

```typescript
// From app/api/orders/[orderId]/refund/route.ts
export async function POST(req: Request, { params }: { params: { orderId: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check refund eligibility
  const refundDecision = await checkDigitalRefundEligibility(orderId);
  if (!refundDecision.canRefund) {
    return NextResponse.json({
      error: "Refund not allowed",
      reason: refundDecision.reason,
    }, { status: 403 });
  }

  // Process Stripe refund
  const refund = await stripeSecret.instance.refunds.create({
    payment_intent: paymentIntentId,
    amount: Math.round(order.totalAmount * 100),
    reason: 'requested_by_customer',
  });

  // Update order status
  await db.order.update({
    where: { id: orderId },
    data: {
      status: "REFUNDED",
      paymentStatus: "REFUNDED",
    },
  });
}
```

### Webhook Handling

The Stripe webhook automatically revokes download access on refunds:

```typescript
// From app/api/stripe/webhooks/route.ts
case "charge.refunded": {
  const charge = event.data.object as Stripe.Charge;
  
  // Find associated order and revoke download access
  const order = await db.order.findFirst({
    where: { stripeSessionId: { contains: charge.payment_intent as string } },
  });

  if (order && order.isDigital) {
    await db.order.update({
      where: { id: order.id },
      data: {
        status: "REFUNDED",
        paymentStatus: "REFUNDED",
      }
    });
  }
}
```

## Guest Checkout

### When Guest Checkout is Allowed

Guest checkout is permitted for:
- Orders under $100
- Non-digital products
- Physical items only

### Implementation

```typescript
// Guest checkout flow
const requiresAuth = totalOrderValue >= 100 || product.isDigital;

if (!requiresAuth) {
  // Proceed with guest checkout
  const sessionParams = {
    // ... Stripe session configuration
    metadata: {
      userId: session?.user?.id || 'guest', // Track guest vs authenticated
      // ... other metadata
    },
  };
}
```

### Guest Order Tracking

Guest orders are tracked with `userId: 'guest'` in the metadata, allowing for:
- Order processing and fulfillment
- Customer support
- Analytics and reporting
- No authentication barriers

## Country Exclusion Validation

### Overview

The system validates country exclusions at checkout to prevent orders from countries where sellers don't ship, even if users try to bypass location-based filtering.

### Implementation

```typescript
// Check country exclusions at checkout
if (product.seller?.excludedCountries && product.seller.excludedCountries.length > 0) {
  const userCountry = req.headers.get('x-user-country') || req.headers.get('cf-ipcountry');
  
  if (userCountry && product.seller.excludedCountries.includes(userCountry)) {
    return NextResponse.json({ 
      error: "Shipping not available to your location",
      details: `This seller does not ship to ${userCountry}.`,
      excludedCountry: userCountry,
      excludedCountries: product.seller.excludedCountries
    }, { status: 403 });
  }
}
```

### Frontend Integration

The checkout button passes the user's country in request headers:

```typescript
// From CheckoutButton component
const country = userCountry || 
               (typeof window !== 'undefined' && window.navigator.language.split('-')[1]) ||
               'US';

const response = await fetch("/api/stripe/create-payment-intent", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-user-country": country,
  },
  // ... request body
});
```

### Error Handling

When a country exclusion is detected:
1. API returns 403 status with detailed error message
2. Frontend shows user-friendly error toast
3. Order processing is blocked
4. User is informed about shipping restrictions

## Dynamic Shipping Cost Calculation

### Overview

The system calculates shipping costs dynamically based on the buyer's location and seller's shipping profiles, ensuring accurate pricing for domestic vs international shipping.

### Shipping Zone Determination

```typescript
// From lib/shipping-calculator.ts
export function determineShippingZone(
  originCountry: string,
  destinationCountry: string
): { zone: string; isInternational: boolean } {
  // Same country = domestic
  if (originCountry === destinationCountry) {
    return { zone: "NORTH_AMERICA", isInternational: false };
  }

  // Same zone = domestic within zone
  if (originCountryData.zone === destinationCountryData.zone) {
    return { zone: originCountryData.zone, isInternational: false };
  }

  // Different zones = international
  return { zone: destinationCountryData.zone, isInternational: true };
}
```

### Dynamic Cost Calculation

```typescript
// Calculate shipping cost based on profiles
if (product.seller?.shippingProfiles && product.seller.shippingProfiles.length > 0) {
  const defaultProfile = product.seller.shippingProfiles[0];
  const sellerOriginCountry = defaultProfile.countryOfOrigin;
  const userCountry = req.headers.get('x-user-country') || 'US';
  
  const shippingCalculation = calculateShippingCost(
    defaultProfile.rates,
    sellerOriginCountry,
    userCountry,
    quantity
  );
  
  if (shippingCalculation) {
    finalShippingCost = shippingCalculation.price;
  }
}
```

### Shipping Rate Matching

The system matches shipping rates based on:
1. **Exact match**: Same zone and international status
2. **Zone match**: Same zone, different international status
3. **Fallback**: Any available rate

### Additional Item Costs

Shipping costs include additional item charges:

```typescript
const basePrice = matchingRate.price;
const additionalItemCost = matchingRate.additionalItem && quantity > 1 
  ? matchingRate.additionalItem * (quantity - 1) 
  : 0;

const totalPrice = basePrice + additionalItemCost;
```

### Example Scenarios

| Seller Location | Buyer Location | Zone | International | Rate Applied |
|----------------|----------------|------|---------------|--------------|
| US | US | North America | No | Domestic rate |
| US | CA | North America | No | Domestic rate |
| US | GB | Europe | Yes | International rate |
| US | AU | Oceania | Yes | International rate |

### Integration with Stripe

Dynamic shipping costs are included in the Stripe checkout session:

```typescript
const sessionParams = {
  line_items: [
    // Product line item
    {
      price_data: {
        currency: checkoutCurrency,
        product_data: { name: product.name },
        unit_amount: finalProductPriceInCents,
      },
      quantity: parsedQuantity,
    },
    // Dynamic shipping line item
    {
      price_data: {
        currency: checkoutCurrency,
        product_data: { name: 'Shipping & Handling' },
        unit_amount: finalShippingAndHandlingInCents,
      },
      quantity: 1,
    },
  ],
  metadata: {
    sellerOriginCountry: sellerOriginCountry,
    userCountry: userCountry,
    dynamicShipping: 'true',
  },
};
```

## API Endpoints

### Core Payment Endpoints

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/stripe/create-payment-intent` | POST | Create checkout session | Conditional |
| `/api/download/[productId]` | GET | Secure digital download | Yes |
| `/api/orders/[orderId]/refund` | POST | Process refunds | Yes |

### Webhook Endpoints

| Endpoint | Purpose | Events Handled |
|----------|---------|----------------|
| `/api/stripe/webhooks` | Stripe webhook processing | `checkout.session.completed`, `charge.refunded`, `transfer.updated` |

### Authentication Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/auth/[...nextauth]` | NextAuth.js authentication |
| `/api/auth/get-role` | Get user role and permissions |

## Testing

### Test Coverage

The payment system includes comprehensive tests:

```bash
# Run payment processing tests
npm test __tests__/purchase-system/payment-processing.test.ts

# Run refund policy tests
npm test __tests__/refund-policy-simple.test.ts
```

### Test Scenarios

1. **Authentication Requirements**
   - Orders over $100 require auth
   - Digital items require auth
   - Guest checkout for eligible items

2. **Hold Period Calculation**
   - New seller (10 days)
   - Trusted seller (1 day)
   - Not trusted seller (7 days)
   - Digital items (minimum 2 days)

3. **Digital Download Security**
   - Authenticated access only
   - Download tracking
   - Refund policy enforcement

4. **Refund Processing**
   - Pre-download refunds allowed
   - Post-download refunds denied
   - Access revocation on refund

## Troubleshooting

### Common Issues

#### 1. Authentication Modal Not Showing

**Problem**: User sees generic error instead of auth modal
**Solution**: Check that the API returns proper 401 status with `requiresAuth: true`

#### 2. Download Access Denied

**Problem**: User can't download purchased digital product
**Solution**: Verify order status is "COMPLETED" and payment status is "PAID"

#### 3. Refund Processing Fails

**Problem**: Refund API returns 403 error
**Solution**: Check if digital product was downloaded using `digitalDownloadAttempted` field

#### 4. Seller Payout Delays

**Problem**: Seller not receiving funds on expected date
**Solution**: Check seller account age and reputation metrics

### Debug Logging

The system includes comprehensive logging:

```typescript
// Enable debug logging
console.log(`💰 Transfer calculation: ${amountToSeller} cents`);
console.log(`⏰ Hold period: ${holdPeriodDays} days`);
console.log(`✅ Order created: ${order.id}`);
```

### Monitoring

Key metrics to monitor:
- Authentication requirement triggers
- Download attempt rates
- Refund request patterns
- Hold period distributions
- Webhook processing success rates

## Security Considerations

### Data Protection

- All sensitive data is encrypted at rest
- Stripe handles PCI compliance
- User sessions are properly managed
- API endpoints validate authentication

### Fraud Prevention

- Authentication required for high-value orders
- Digital download tracking prevents abuse
- Seller hold periods protect against chargebacks
- IP tracking and device fingerprinting

### Access Control

- Secure download endpoints
- Refund policy enforcement
- Role-based permissions
- Session validation

## Future Enhancements

### Planned Features

1. **Advanced Fraud Detection**
   - Machine learning risk scoring
   - Behavioral analysis
   - Device fingerprinting

2. **Flexible Hold Periods**
   - Seller-configurable holds
   - Dynamic adjustment based on performance
   - Category-specific rules

3. **Enhanced Refund Management**
   - Partial refunds for digital products
   - Time-based refund windows
   - Automated refund processing

4. **Payment Method Expansion**
   - Buy now, pay later options
   - Cryptocurrency payments
   - International payment methods

---

*This documentation covers the current implementation as of the latest update. For questions or issues, please refer to the troubleshooting section or contact the development team.* 
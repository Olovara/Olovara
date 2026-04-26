# USPS Shipping API (Modern APIs 2026) — Integration Notes

## What was added

- **Normalized shipping layer**: `lib/shipping-carriers/*`
  - Provider interface + aggregator + filtering
  - USPS provider adapter (rates only for now)
- **Checkout-oriented helpers** (platform-owned USPS account; seller is only the **origin** address)
  - `lib/shipping/usps-seller-origin.ts` — Zod schema for seller `uspsOriginAddress`
  - `lib/shipping/parcel-from-product.ts` — `calculateParcelsFromProduct()` from product weight/dims × quantity
  - `lib/shipping/get-rates-for-product.ts` — `getRatesForProductCheckout({ productId, buyerAddress, ... })`
- **Server endpoints**
  - `POST /api/shipping/rates` — get live rates for a product + destination
  - `POST /api/shipping/labels` — buy a label (stubbed; will throw until implemented)

## Seller model (Prisma)

When a seller uses **your** USPS account for live rates / future labels:

- `Seller.uspsIntegrationEnabled` — turn on USPS path (requires valid `uspsOriginAddress`).
- `Seller.uspsOriginAddress` — JSON matching `UspsOriginAddressSchema` in `lib/shipping/usps-seller-origin.ts`:
  - `name`, `line1`, optional `line2`, `city`, `state`, `postalCode`, `country` (ISO-2)

**Rate selection:** If `uspsIntegrationEnabled` is true, `getRatesForProductCheckout` uses **only** `uspsOriginAddress` as `shipFrom` (no fallback to encrypted default shop address). If integration is off, `shipFrom` comes from the seller’s default `Address` row (decrypted), same as before.

**Money flow (your rule):** With USPS auto rates, the buyer pays you for shipping; you buy the label on your USPS account — the seller does **not** receive that shipping line item as revenue. Track margin on the order (below).

## Order model (Prisma)

For analytics after you buy a label (webhook / fulfillment job):

- `Order.shippingLabelCost` — what **you** paid USPS (minor units, same convention as `shippingCost` from checkout metadata).
- `Order.shippingProfit` — margin you want to store (e.g. `shippingCost` charged to buyer minus `shippingLabelCost`), optional until you persist it.

## USPS credentials (required for live rates)

Set these environment variables:

- `USPS_CLIENT_ID`
- `USPS_CLIENT_SECRET`
- `USPS_ENV` = `production` (default) or `test`/`tem`

USPS base URLs used by the adapter:

- Production: `https://apis.usps.com`
- Test (TEM): `https://apis-tem.usps.com`

Token endpoint:

- `POST /oauth2/v3/token` (OAuth2 client_credentials)

Rate endpoints used:

- Domestic: `POST /prices/v3/base-rates/search`
- International: `POST /international-prices/v3/base-rates-list/search`

## Test call

Example request body for `POST /api/shipping/rates`:

```json
{
  "productId": "YOUR_PRODUCT_ID",
  "quantity": 1,
  "shipTo": {
    "line1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "US"
  }
}
```

### Important constraints (current)

- **Weights/dimensions must exist** on the product (`itemWeight`, optional dimensions). If missing, we fall back to weight=1 `lb`.
- We return USPS prices in **USD**. If you want to charge in another currency, convert using your existing currency conversion layer.

## Next steps for label buying

USPS label purchase requires more than rates:

- sender/recipient validation requirements
- package details per label product
- account/payment configuration for postage purchase
- label format (PDF/PNG/ZPL)

When you’re ready, we’ll implement the `/labels/v3/*` flow inside:

- `lib/shipping-carriers/usps/usps-provider.ts` → `buyLabel()`
- and persist label + tracking to your DB (likely a new `Shipment` model linked to `Order`)


# Testing Stripe Webhooks Locally

## Prerequisites

1. **Install Stripe CLI**
   - Windows: Download from https://stripe.com/docs/stripe-cli
   - Or use: `scoop install stripe` or `choco install stripe`
   - Mac: `brew install stripe/stripe-cli/stripe`
   - Linux: See https://stripe.com/docs/stripe-cli

2. **Login to Stripe CLI**
   ```bash
   stripe login
   ```
   This will open your browser to authenticate with your Stripe account.

## Setup Steps

### Step 1: Start Your Local Development Server

In one terminal, start your Next.js dev server:
```bash
npm run dev
# or
yarn dev
```

Your server should be running on `http://localhost:3000` (or your configured port).

### Step 2: Forward Webhooks to Your Local Server

In a **separate terminal**, run:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

**Important:** The CLI will output a webhook signing secret that looks like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

**Note:** You may need to restart your dev server after adding this to your `.env.local` file.

### Step 4: Test Webhooks

You have two options:

#### Option A: Trigger Test Events Manually

Use Stripe CLI to trigger specific events:
```bash
# Test checkout.session.completed
stripe trigger checkout.session.completed

# Test payment_intent.succeeded
stripe trigger payment_intent.succeeded

# Test account.updated
stripe trigger account.updated
```

#### Option B: Complete a Real Test Checkout

1. Go to your local app: `http://localhost:3000`
2. Add a product to cart and proceed to checkout
3. Use Stripe test card: `4242 4242 4242 4242`
4. Use any future expiry date, any CVC, any ZIP
5. Complete the checkout
6. The webhook will automatically fire and you'll see it in both terminals

## Monitoring Webhook Events

### In Your Dev Server Terminal
You'll see detailed logs from your webhook handler:
```
🔔 Webhook received at /api/stripe/webhooks
✅ Processing checkout.session.completed
📋 Session details: payment_intent=EXISTS, metadata=EXISTS...
```

### In Stripe CLI Terminal
You'll see the raw webhook events:
```
2024-01-15 10:30:45   --> checkout.session.completed [evt_xxx]
2024-01-15 10:30:45  <--  [200] POST http://localhost:3000/api/stripe/webhooks [evt_xxx]
```

## Common Issues & Solutions

### Issue: "No webhook secret found"
**Solution:** Make sure you've:
1. Copied the webhook secret from `stripe listen` output
2. Added it to `.env.local` as `STRIPE_WEBHOOK_SECRET`
3. Restarted your dev server

### Issue: "Webhook verification failed"
**Solution:** 
- Make sure you're using the webhook secret from the **current** `stripe listen` session
- Each `stripe listen` session generates a new secret
- If you restart `stripe listen`, update your `.env.local` with the new secret

### Issue: "Connection refused"
**Solution:**
- Make sure your dev server is running on the port specified in `stripe listen`
- Check that the URL in `stripe listen` matches your server URL

### Issue: Webhook not firing after checkout
**Solution:**
- Check that `stripe listen` is still running
- Verify the webhook endpoint URL is correct: `/api/stripe/webhooks`
- Check your dev server logs for any errors

## Testing Specific Scenarios

### Test Guest Checkout
1. Log out (or use incognito)
2. Complete checkout as guest
3. Check logs for `userId: null` in order creation

### Test with Discount Code
1. Create a discount code in Stripe dashboard (test mode)
2. Use it during checkout
3. Verify discount is applied in webhook logs

### Test Transfer Failures
1. Use a test account that's not fully connected
2. Complete checkout
3. Check logs for transfer error messages

## Useful Stripe CLI Commands

```bash
# Listen and forward webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhooks

# Listen with specific events only
stripe listen --forward-to localhost:3000/api/stripe/webhooks --events checkout.session.completed,payment_intent.succeeded

# View webhook events history
stripe events list

# Resend a specific webhook event
stripe events resend evt_xxxxxxxxxxxxx

# Get webhook endpoint details
stripe webhook_endpoints list
```

## Quick Reference

**Terminal 1 (Dev Server):**
```bash
npm run dev
```

**Terminal 2 (Webhook Forwarding):**
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

**Terminal 3 (Optional - Trigger Events):**
```bash
stripe trigger checkout.session.completed
```

## Next Steps

After testing locally, you can:
1. Test in Stripe's test mode dashboard
2. Use Stripe's webhook testing tool in the dashboard
3. Set up a staging environment with a public URL (using ngrok or similar)

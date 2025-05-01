import Stripe from "stripe";

// Helper function to get the appropriate key based on environment
function getStripeKey(key: string, isTest: boolean = false) {
  if (isTest) {
    return process.env.STRIPE_SECRET_KEY!; // Use test key
  }
  return process.env[key]!; // Use production key
}

// Checkout instance - for customer payments
export const stripeCheckout = new Stripe(getStripeKey('STRIPE_CHECKOUT_KEY'), {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

// Connect instance - for seller onboarding and payouts
export const stripeConnect = new Stripe(getStripeKey('STRIPE_CONNECT_KEY'), {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

// Webhook instance - for handling webhooks
export const stripeWebhook = new Stripe(getStripeKey('STRIPE_WEBHOOK_KEY'), {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

// Helper function to get the appropriate Stripe instance based on operation
export function getStripeInstance(operation: 'checkout' | 'connect' | 'webhook') {
  switch (operation) {
    case 'checkout':
      return stripeCheckout;
    case 'connect':
      return stripeConnect;
    case 'webhook':
      return stripeWebhook;
    default:
      throw new Error('Invalid Stripe operation');
  }
}
import Stripe from "stripe";

// Helper function to get the appropriate key based on environment
function getStripeKey(key: string, isTest: boolean = false) {
  if (isTest) {
    return process.env.STRIPE_SECRET_KEY!; // Use test key
  }
  return process.env[key]!; // Use production key
}

// Create Stripe instances with different keys for different purposes
export const stripeWebhook = new Stripe(process.env.STRIPE_WEBHOOK_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export const stripeCheckout = new Stripe(process.env.STRIPE_CHECKOUT_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export const stripeConnect = new Stripe(process.env.STRIPE_CONNECT_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

// Add secret key instance for balance operations
export const stripeSecret = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
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
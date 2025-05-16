import Stripe from "stripe";

// Helper function to get the appropriate key based on environment
function getStripeKey(key: string) {
  if (typeof window !== 'undefined') {
    throw new Error('Stripe should only be initialized on the server side');
  }
  
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Lazy initialization of Stripe instances
let stripeWebhookInstance: Stripe | null = null;
let stripeCheckoutInstance: Stripe | null = null;
let stripeConnectInstance: Stripe | null = null;
let stripeSecretInstance: Stripe | null = null;

export const stripeWebhook = {
  get instance() {
    if (!stripeWebhookInstance) {
      stripeWebhookInstance = new Stripe(getStripeKey('STRIPE_WEBHOOK_KEY'), {
        apiVersion: "2025-02-24.acacia",
      });
    }
    return stripeWebhookInstance;
  }
};

export const stripeCheckout = {
  get instance() {
    if (!stripeCheckoutInstance) {
      stripeCheckoutInstance = new Stripe(getStripeKey('STRIPE_CHECKOUT_KEY'), {
        apiVersion: "2025-02-24.acacia",
      });
    }
    return stripeCheckoutInstance;
  }
};

export const stripeConnect = {
  get instance() {
    if (!stripeConnectInstance) {
      stripeConnectInstance = new Stripe(getStripeKey('STRIPE_CONNECT_KEY'), {
        apiVersion: "2025-02-24.acacia",
      });
    }
    return stripeConnectInstance;
  }
};

export const stripeSecret = {
  get instance() {
    if (!stripeSecretInstance) {
      stripeSecretInstance = new Stripe(getStripeKey('STRIPE_SECRET_KEY'), {
        apiVersion: "2025-02-24.acacia",
      });
    }
    return stripeSecretInstance;
  }
};

// Helper function to get the appropriate Stripe instance based on operation
export function getStripeInstance(operation: 'checkout' | 'connect' | 'webhook') {
  switch (operation) {
    case 'checkout':
      return stripeCheckout.instance;
    case 'connect':
      return stripeConnect.instance;
    case 'webhook':
      return stripeWebhook.instance;
    default:
      throw new Error('Invalid Stripe operation');
  }
}
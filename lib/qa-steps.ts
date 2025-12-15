/**
 * Step constants for QA event tracking
 *
 * These define canonical steps for different user flows.
 * Use these constants when logging QA events to ensure consistency.
 */

/**
 * Product Creation Flow Steps
 */
export const PRODUCT_STEPS = {
  DETAILS: "details",
  IMAGES: "images",
  PRICING: "pricing",
  FILE_UPLOAD: "file_upload",
  REVIEW: "review",
  SUBMIT: "submit",
} as const;

/**
 * Checkout Flow Steps
 */
export const CHECKOUT_STEPS = {
  CART: "cart",
  SHIPPING: "shipping",
  PAYMENT: "payment",
  REVIEW: "review",
  COMPLETE: "complete",
} as const;

/**
 * Seller Onboarding Flow Steps
 */
export const SELLER_ONBOARDING_STEPS = {
  APPLICATION: "application",
  PROFILE_SETUP: "profile_setup",
  STRIPE_CONNECTION: "stripe_connection",
  SHIPPING_SETUP: "shipping_setup",
  FIRST_PRODUCT: "first_product",
  COMPLETE: "complete",
} as const;

/**
 * Custom Order Flow Steps
 */
export const CUSTOM_ORDER_STEPS = {
  FORM_SUBMIT: "form_submit",
  MATERIALS_PAYMENT: "materials_payment",
  REVIEW: "review",
  FINAL_PAYMENT: "final_payment",
  COMPLETE: "complete",
} as const;

/**
 * Event Categories
 */
export const QA_EVENTS = {
  PRODUCT_CREATE: "PRODUCT_CREATE",
  PRODUCT_EDIT: "PRODUCT_EDIT",
  CHECKOUT: "CHECKOUT",
  SELLER_ONBOARDING: "SELLER_ONBOARDING",
  CUSTOM_ORDER: "CUSTOM_ORDER",
  PROFILE_UPDATE: "PROFILE_UPDATE",
  SETTINGS_UPDATE: "SETTINGS_UPDATE",
} as const;

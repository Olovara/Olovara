/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to /settings
 * @type {string[]}
 */
export const authRoutes = [
  "/login",
  "/register",
  "/error",
  "/reset-password",
  "/new-password",
];

/**
 * An array of routes that are accessible to the public
 * These routes do not require authentication
 * @type {string[]}
 */
export const publicRoutes = [
  "/",
  "/about",
  "/contact",
  "/blog",
  "/products",
  "/api/webhook",
  "/api/stripe/webhooks",
  "/api/auth/check-permission",
];

/**
 * An array of routes that are accessible to admin users
 * These routes require admin role
 * @type {string[]}
 */
export const adminRoutes = [
  "/admin",
];

/**
 * An array of routes that are accessible to seller users
 * These routes require seller role
 * @type {string[]}
 */
export const sellerRoutes = [
  "/seller",
  "/seller/dashboard/messages",
];

/**
 * An array of routes that are accessible to member users
 * These routes require member role
 * @type {string[]}
 */
export const memberRoutes = [
  "/member",
  "/member/dashboard/messages",
];

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API authentication purposes
 * @type {string}
 */
export const apiAuthPrefix = "/api/auth";

/**
 * The default redirect path after logging in
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = "/";

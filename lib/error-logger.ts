import { db } from "./db";

/**
 * Error logging levels
 */
export type ErrorLevel = "info" | "warn" | "error" | "fatal";

/**
 * Options for logging an error
 */
export interface LogErrorOptions {
  code: string; // Error code like "PRODUCT_CREATE_FAILED"
  userId?: string | null; // Optional user ID
  route?: string; // API route or page path
  method?: string; // HTTP method
  error?: Error | unknown; // The error object
  metadata?: Record<string, any>; // Additional context
  message?: string; // Custom message (defaults to error message or code)
}

/**
 * Logs an error to both console and database
 *
 * CRITICAL: This function is bulletproof - it will NEVER throw or break your app.
 *
 * Rules:
 * 1. Console log ALWAYS happens first (synchronous)
 * 2. DB write is fire-and-forget (never awaited, never throws)
 * 3. Returns user-friendly message immediately
 *
 * If database is down, you still get console logs.
 * If database write fails, it's logged to console but doesn't break the request.
 *
 * @example
 * ```ts
 * try {
 *   await createProduct(data);
 * } catch (e) {
 *   const userMessage = logError({
 *     code: "PRODUCT_CREATE_FAILED",
 *     userId: session.user.id,
 *     route: "/api/products/create-product",
 *     method: "POST",
 *     error: e,
 *     metadata: { productName: data.name, isDigital: data.isDigital }
 *   });
 *   throw new Error(userMessage);
 * }
 * ```
 */
export function logError(options: LogErrorOptions): string {
  const {
    code,
    userId,
    route,
    method,
    error,
    metadata = {},
    message,
  } = options;

  // Determine error level from code or error type
  let level: ErrorLevel = "error";
  if (code.includes("FAILED") || code.includes("ERROR")) {
    level = "error";
  } else if (code.includes("WARN") || code.includes("WARNING")) {
    level = "warn";
  } else if (code.includes("FATAL") || code.includes("CRITICAL")) {
    level = "fatal";
  } else if (code.includes("INFO")) {
    level = "info";
  }

  // Extract error details
  let errorMessage = message;
  let errorDetails: any = null;

  // Check if this is a Next.js redirect error - these are expected and shouldn't be logged
  if (error instanceof Error) {
    // NEXT_REDIRECT is expected behavior in Next.js - don't log it
    if (
      error.message === "NEXT_REDIRECT" ||
      (error as any).digest?.startsWith("NEXT_REDIRECT") ||
      (error as any).digest === "515638683" // Common redirect digest
    ) {
      // Return early without logging - this is not an error
      return "Redirecting...";
    }

    errorMessage = errorMessage || error.message;
    errorDetails = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  } else if (error) {
    errorMessage = errorMessage || String(error);
    errorDetails = { raw: String(error) };
  } else {
    errorMessage = errorMessage || code;
  }

  // Prepare metadata with additional context
  const fullMetadata = {
    ...metadata,
    timestamp: new Date().toISOString(),
    ...(errorDetails && { errorDetails }),
  };

  // 1️⃣ ALWAYS log to console FIRST (synchronous, always happens)
  const logContext = {
    code,
    level,
    userId,
    route,
    method,
    message: errorMessage,
    ...(Object.keys(metadata).length > 0 && { metadata }),
  };

  if (level === "fatal" || level === "error") {
    console.error(`[${code}] ${errorMessage}`, logContext);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
  } else if (level === "warn") {
    console.warn(`[${code}] ${errorMessage}`, logContext);
  } else {
    console.log(`[${code}] ${errorMessage}`, logContext);
  }

  // 2️⃣ Fire-and-forget DB write (NEVER awaited, NEVER throws)
  // This ensures database failures don't break the request
  Promise.resolve()
    .then(() => {
      // Add timeout to prevent slow DB writes from piling up
      return Promise.race([
        db.errorLog.create({
          data: {
            level,
            code,
            message: errorMessage,
            userId: userId || null,
            route: route || null,
            method: method || null,
            metadata: fullMetadata,
            error: errorDetails,
          },
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Log timeout")), 2000)
        ),
      ]);
    })
    .catch((dbError) => {
      // 3️⃣ DB logging must NEVER throw - log failure to console only
      console.error("[ERROR_LOG_DB_FAILED]", {
        code,
        dbError:
          dbError instanceof Error
            ? {
                name: dbError.name,
                message: dbError.message,
                stack: dbError.stack,
              }
            : dbError,
        note: "Database error logging failed, but console log succeeded",
      });
    });

  // Return user-friendly message
  // These messages should be shown to users in the UI
  const userMessages: Record<string, string> = {
    // Seller Onboarding
    SIGNUP_FAILED:
      "We couldn't create your account. Please try again or contact support.",
    EMAIL_VERIFICATION_FAILED:
      "We couldn't send the verification email. Please check your email address and try again.",
    SELLER_APPLICATION_FAILED:
      "We couldn't submit your seller application. Please try again or contact support.",
    STRIPE_CONNECT_FAILED:
      "We couldn't connect your Stripe account. Please try again or contact support.",
    STRIPE_ACCOUNT_CREATE_FAILED:
      "We couldn't create your payment account. Please try again or contact support.",
    ONBOARDING_FETCH_FAILED:
      "We couldn't load your onboarding progress. Please refresh the page and try again.",
    ONBOARDING_STEP_UPDATE_FAILED:
      "We couldn't save your progress. Please try again or contact support.",

    // Product Listing
    PRODUCT_CREATE_FAILED:
      "We couldn't save your product. Please try again or contact support.",
    PRODUCT_UPDATE_FAILED:
      "We couldn't update your product. Please try again or contact support.",
    IMAGE_UPLOAD_FAILED:
      "We couldn't upload your images. Please check your files and try again.",
    FILE_UPLOAD_FAILED:
      "We couldn't upload your file. Please check the file and try again.",
    PRODUCT_PUBLISH_FAILED:
      "We couldn't publish your product. Please try again or contact support.",
    PRODUCT_DUPLICATE_FAILED:
      "We couldn't duplicate your product. Please try again or contact support.",

    // Checkout
    CHECKOUT_FAILED:
      "We couldn't process your checkout. Please try again or contact support.",
    CHECKOUT_PRODUCT_FETCH_FAILED:
      "We couldn't load the product details. Please refresh the page and try again.",
    PAYMENT_INTENT_FAILED:
      "We couldn't create your payment. Please try again or contact support.",
    ORDER_CREATE_FAILED:
      "We couldn't create your order. Please try again or contact support.",
    ORDER_REFUND_FAILED:
      "We couldn't process your refund. Please try again or contact support.",
    ORDER_CANCEL_FAILED:
      "We couldn't cancel your order. Please try again or contact support.",
    STRIPE_REFUND_FAILED:
      "We couldn't process your refund through the payment system. Please contact support.",
    STRIPE_PAYMENT_FAILED:
      "Your payment couldn't be processed. Please check your payment method and try again.",
    TRANSFER_FAILED:
      "We couldn't transfer funds to the seller. Please contact support.",

    // Reviews
    REVIEW_CREATE_FAILED:
      "We couldn't submit your review. Please try again or contact support.",
    REVIEW_FETCH_FAILED:
      "We couldn't load the reviews. Please refresh the page and try again.",

    // File Operations
    FILE_PROCESSING_FAILED: "We couldn't process your file. Please try again.",
    IMAGE_PROCESSING_FAILED:
      "We couldn't process your images. Please check the file format and try again.",

    // Seller Routes
    SELLER_DASHBOARD_FETCH_FAILED:
      "We couldn't load your dashboard. Please refresh the page and try again.",
    SELLER_PREFERENCES_FETCH_FAILED:
      "We couldn't load your preferences. Please refresh the page and try again.",
    SELLER_PRODUCTS_FETCH_FAILED:
      "We couldn't load your products. Please refresh the page and try again.",
    SELLER_EXCLUSIONS_FETCH_FAILED:
      "We couldn't load your shipping exclusions. Please refresh the page and try again.",
    SELLER_COMPLIANCE_FETCH_FAILED:
      "We couldn't load your compliance information. Please refresh the page and try again.",
    SELLER_CURRENCY_FETCH_FAILED:
      "We couldn't load your currency settings. Please refresh the page and try again.",
    SELLER_COUNTRY_FETCH_FAILED:
      "We couldn't load your country information. Please refresh the page and try again.",
    SELLER_SEO_FETCH_FAILED:
      "We couldn't load your SEO settings. Please refresh the page and try again.",
    SELLER_SEO_UPDATE_FAILED:
      "We couldn't update your SEO settings. Please try again or contact support.",
    SELLER_GPSR_CHECK_FAILED:
      "We couldn't check your GPSR compliance status. Please refresh the page and try again.",
    ONBOARDING_STATUS_FETCH_FAILED:
      "We couldn't load your onboarding status. Please refresh the page and try again.",

    // Seller Onboarding Actions
    SELLER_ONBOARDING_MARK_SHOP_NAMING_FAILED:
      "We couldn't mark your shop naming step as complete. Please try again or contact support.",
    SELLER_ONBOARDING_MARK_SHOP_PREFERENCES_FAILED:
      "We couldn't mark your shop preferences step as complete. Please try again or contact support.",
    SELLER_ONBOARDING_MARK_PAYMENT_SETUP_FAILED:
      "We couldn't mark your payment setup step as complete. Please try again or contact support.",
    SELLER_ONBOARDING_MARK_APPLICATION_SUBMITTED_FAILED:
      "We couldn't mark your application submitted step as complete. Please try again or contact support.",
    SELLER_ONBOARDING_MARK_APPLICATION_APPROVED_FAILED:
      "We couldn't mark your application approved step as complete. Please try again or contact support.",
    SELLER_ONBOARDING_STATUS_FETCH_FAILED:
      "We couldn't load your onboarding status. Please refresh the page and try again.",
    SELLER_ONBOARDING_STEP_UPDATE_FAILED:
      "We couldn't update your onboarding step. Please try again or contact support.",

    // Discount Codes
    DISCOUNT_CODES_FETCH_FAILED:
      "We couldn't load your discount codes. Please refresh the page and try again.",
    DISCOUNT_CODE_CREATE_FAILED:
      "We couldn't create your discount code. Please try again or contact support.",
    DISCOUNT_CODE_FETCH_FAILED:
      "We couldn't load the discount code. Please refresh the page and try again.",
    DISCOUNT_CODE_UPDATE_FAILED:
      "We couldn't update your discount code. Please try again or contact support.",
    DISCOUNT_CODE_TOGGLE_FAILED:
      "We couldn't update your discount code status. Please try again or contact support.",
    DISCOUNT_CODE_DELETE_FAILED:
      "We couldn't delete your discount code. Please try again or contact support.",

    // Shipping Options
    SHIPPING_OPTION_CREATE_FAILED:
      "We couldn't create your shipping option. Please try again or contact support.",
    SHIPPING_OPTIONS_FETCH_FAILED:
      "We couldn't load your shipping options. Please refresh the page and try again.",
    SHIPPING_OPTION_FETCH_FAILED:
      "We couldn't load the shipping option. Please refresh the page and try again.",
    SHIPPING_OPTION_UPDATE_FAILED:
      "We couldn't update your shipping option. Please try again or contact support.",
    SHIPPING_OPTION_DELETE_FAILED:
      "We couldn't delete your shipping option. Please try again or contact support.",
    SHIPPING_OPTION_DUPLICATE_FAILED:
      "We couldn't duplicate your shipping option. Please try again or contact support.",

    // Stripe Routes
    STRIPE_WEBHOOK_FORWARD_FAILED:
      "Webhook processing failed. Please contact support.",
    STRIPE_CUSTOMER_CREATE_FAILED:
      "We couldn't create your payment account. Please try again or contact support.",
    STRIPE_SUBSCRIPTION_CREATE_FAILED:
      "We couldn't create your subscription. Please try again or contact support.",
    STRIPE_ONBOARDING_CHECK_FAILED:
      "We couldn't check your payment account status. Please try again or contact support.",
    CUSTOM_ORDER_PAYMENT_CREATE_FAILED:
      "We couldn't create your payment session. Please try again or contact support.",
    CUSTOM_ORDER_WEBHOOK_PROCESSING_FAILED:
      "Payment processing failed. Please contact support.",

    // Product Downloads
    PRODUCT_DOWNLOAD_FAILED:
      "We couldn't process your download. Please try again or contact support.",

    // UploadThing Routes
    FILE_UPLOAD_RECORD_FAILED:
      "We couldn't record your file upload. The file was uploaded but may not be saved. Please try again or contact support.",
    DMCA_UPLOAD_RECORD_FAILED:
      "We couldn't process your document upload. Please try again or contact support.",
    UPLOADTHING_WEBHOOK_PARSE_FAILED:
      "Webhook processing failed. Please contact support.",
    UPLOADTHING_WEBHOOK_VERIFICATION_FAILED:
      "Webhook verification failed. Please contact support.",
    UPLOADTHING_WEBHOOK_DB_FAILED:
      "We couldn't process your upload. Please try again or contact support.",
    UPLOADTHING_WEBHOOK_PROCESSING_FAILED:
      "Upload processing failed. Please contact support.",

    // User Profile
    USER_PROFILE_FETCH_FAILED:
      "We couldn't load your profile. Please refresh the page and try again.",
    USER_PROFILE_UPDATE_FAILED:
      "We couldn't update your profile. Please try again or contact support.",

    // User Activity & Behavior
    USER_ACTIVITY_TRACK_FAILED:
      "We couldn't track your activity. Please try again or contact support.",
    USER_ACTIVITY_FETCH_FAILED:
      "We couldn't load your activity. Please refresh the page and try again.",
    USER_BEHAVIOR_TRACK_FAILED:
      "We couldn't track your behavior. Please try again or contact support.",
    USER_BEHAVIOR_FETCH_FAILED:
      "We couldn't load your behavior data. Please refresh the page and try again.",

    // User Management (Admin)
    USER_ROLE_UPDATE_FAILED:
      "We couldn't update the user role. Please try again or contact support.",
    USER_TEST_ACCESS_CHECK_FAILED:
      "We couldn't check test environment access. Please try again or contact support.",
    USER_PERMISSION_ADD_FAILED:
      "We couldn't add the permission. Please try again or contact support.",
    USER_PERMISSION_REMOVE_FAILED:
      "We couldn't remove the permission. Please try again or contact support.",

    // Website Builder
    WEBSITE_FETCH_FAILED:
      "We couldn't load your website. Please refresh the page and try again.",
    WEBSITE_CREATE_FAILED:
      "We couldn't create your website. Please try again or contact support.",
    WEBSITE_PUBLISH_FAILED:
      "We couldn't publish your website. Please try again or contact support.",
    WEBSITE_PAGE_UPDATE_FAILED:
      "We couldn't update your page. Please try again or contact support.",
    WEBSITE_PAGE_DELETE_FAILED:
      "We couldn't delete your page. Please try again or contact support.",
    WEBSITE_TEMPLATES_FETCH_FAILED:
      "We couldn't load the templates. Please refresh the page and try again.",
    WEBSITE_TEMPLATE_CREATE_FAILED:
      "We couldn't create the template. Please try again or contact support.",
    WEBSITE_TEMPLATE_APPLY_FAILED:
      "We couldn't apply the template. Please try again or contact support.",

    // Suggestions
    SUGGESTION_CREATE_FAILED:
      "We couldn't submit your suggestion. Please try again or contact support.",
    SUGGESTION_UPVOTE_FAILED:
      "We couldn't upvote the suggestion. Please try again or contact support.",
    SUGGESTION_UPVOTE_REMOVE_FAILED:
      "We couldn't remove your upvote. Please try again or contact support.",

    // Analytics
    MARKETPLACE_ANALYTICS_FETCH_FAILED:
      "We couldn't load the marketplace analytics. Please refresh the page and try again.",
    MARKETPLACE_ANALYTICS_GENERATE_FAILED:
      "We couldn't generate the marketplace analytics. Please try again or contact support.",
    SELLER_ANALYTICS_FETCH_FAILED:
      "We couldn't load your analytics. Please refresh the page and try again.",
    SELLER_ANALYTICS_GENERATE_FAILED:
      "We couldn't generate your analytics. Please try again or contact support.",
    BEHAVIOR_ANALYTICS_TRACK_FAILED:
      "We couldn't track your behavior. Please try again or contact support.",
    BEHAVIOR_ANALYTICS_FETCH_FAILED:
      "We couldn't load behavior analytics. Please refresh the page and try again.",
    SESSION_ANALYTICS_CREATE_FAILED:
      "We couldn't create your session. Please try again or contact support.",
    SESSION_ANALYTICS_END_FAILED:
      "We couldn't end your session. Please try again or contact support.",
    SESSION_ANALYTICS_FETCH_FAILED:
      "We couldn't load session analytics. Please refresh the page and try again.",
    ABANDONED_CART_SAVE_FAILED:
      "We couldn't save your cart data. Please try again or contact support.",
    ABANDONED_CART_ANALYTICS_FETCH_FAILED:
      "We couldn't load abandoned cart analytics. Please refresh the page and try again.",
    ABANDONED_CART_DELETE_FAILED:
      "We couldn't delete the cart record. Please try again or contact support.",
    SEARCH_ANALYTICS_TRACK_FAILED:
      "We couldn't track your search. Please try again or contact support.",
    SEARCH_ANALYTICS_CLICK_UPDATE_FAILED:
      "We couldn't update your search click. Please try again or contact support.",
    SEARCH_CLICK_TRACK_FAILED:
      "We couldn't track your search click. Please try again or contact support.",
    FRAUD_EVENTS_FETCH_FAILED:
      "We couldn't load fraud events. Please refresh the page and try again.",
    FRAUD_EVENT_CREATE_FAILED:
      "We couldn't create the fraud event. Please try again or contact support.",
    FRAUD_EVENT_UPDATE_FAILED:
      "We couldn't update the fraud event. Please try again or contact support.",

    // Applications
    APPLICATION_APPROVE_FAILED:
      "We couldn't approve the application. Please try again or contact support.",
    APPLICATION_REJECT_FAILED:
      "We couldn't reject the application. Please try again or contact support.",

    // Currency
    CURRENCY_CONVERT_FAILED:
      "We couldn't convert the currency. Please try again or contact support.",

    // IP & Location
    IP_DETECTION_FAILED:
      "We couldn't detect your IP address. Please try again or contact support.",
    LOCATION_PREFERENCES_FETCH_FAILED:
      "We couldn't load your location preferences. Please refresh the page and try again.",
    LOCATION_PREFERENCES_UPDATE_FAILED:
      "We couldn't update your location preferences. Please try again or contact support.",

    // Messages
    MESSAGES_FETCH_FAILED:
      "We couldn't load your messages. Please refresh the page and try again.",
    CONVERSATIONS_FETCH_FAILED:
      "We couldn't load your conversations. Please refresh the page and try again.",
    CONVERSATION_CREATE_FAILED:
      "We couldn't create the conversation. Please try again or contact support.",

    // Newsletter
    NEWSLETTER_SUBSCRIBE_FAILED:
      "We couldn't subscribe you to the newsletter. Please try again or contact support.",
    NEWSLETTER_SUBSCRIPTION_CHECK_FAILED:
      "We couldn't check your subscription status. Please try again or contact support.",
    NEWSLETTER_UNSUBSCRIBE_FAILED:
      "We couldn't unsubscribe you from the newsletter. Please try again or contact support.",
    NEWSLETTER_SEND_FAILED:
      "We couldn't send the newsletter. Please try again or contact support.",
    NEWSLETTER_STATISTICS_FETCH_FAILED:
      "We couldn't load newsletter statistics. Please refresh the page and try again.",

    // Blog
    BLOG_POST_CREATE_FAILED:
      "We couldn't create your blog post. Please try again or contact support.",
    BLOG_POSTS_FETCH_FAILED:
      "We couldn't load your blog posts. Please refresh the page and try again.",
    BLOG_POST_FETCH_FAILED:
      "We couldn't load the blog post. Please refresh the page and try again.",
    BLOG_POST_UPDATE_FAILED:
      "We couldn't update your blog post. Please try again or contact support.",
    BLOG_POST_DELETE_FAILED:
      "We couldn't delete your blog post. Please try again or contact support.",
    BLOG_COMMENTS_FETCH_FAILED:
      "We couldn't load the comments. Please refresh the page and try again.",
    BLOG_COMMENT_CREATE_FAILED:
      "We couldn't submit your comment. Please try again or contact support.",
    BLOG_COMMENT_UPDATE_FAILED:
      "We couldn't update your comment. Please try again or contact support.",
    BLOG_COMMENT_DELETE_FAILED:
      "We couldn't delete your comment. Please try again or contact support.",
    BLOG_CATEGORIES_FETCH_FAILED:
      "We couldn't load the categories. Please refresh the page and try again.",
    BLOG_CATEGORY_CREATE_FAILED:
      "We couldn't create the category. Please try again or contact support.",
    BLOG_CATEGORY_UPDATE_FAILED:
      "We couldn't update the category. Please try again or contact support.",
    BLOG_CATEGORY_DELETE_FAILED:
      "We couldn't delete the category. Please try again or contact support.",

    // Policies & Guidelines
    BUYER_RETURNS_POLICY_FETCH_FAILED:
      "We couldn't load the buyer and returns policy. Please refresh the page and try again.",
    BUYER_RETURNS_POLICY_UPDATE_FAILED:
      "We couldn't update the buyer and returns policy. Please try again or contact support.",
    COPYRIGHT_POLICY_FETCH_FAILED:
      "We couldn't load the copyright policy. Please refresh the page and try again.",
    COPYRIGHT_POLICY_UPDATE_FAILED:
      "We couldn't update the copyright policy. Please try again or contact support.",
    HANDMADE_GUIDELINES_FETCH_FAILED:
      "We couldn't load the handmade guidelines. Please refresh the page and try again.",
    HANDMADE_GUIDELINES_UPDATE_FAILED:
      "We couldn't update the handmade guidelines. Please try again or contact support.",
    PRIVACY_POLICY_FETCH_FAILED:
      "We couldn't load the privacy policy. Please refresh the page and try again.",
    PRIVACY_POLICY_UPDATE_FAILED:
      "We couldn't update the privacy policy. Please try again or contact support.",

    // Device Fingerprint
    DEVICE_FINGERPRINT_PROCESS_FAILED:
      "We couldn't process your device information. Please try again or contact support.",
    DEVICE_FINGERPRINT_ANALYSIS_FAILED:
      "We couldn't analyze your device. Please try again or contact support.",

    // Discount
    DISCOUNT_VALIDATION_FAILED:
      "We couldn't validate your discount code. Please try again or contact support.",

    // Help Articles
    HELP_ARTICLES_FETCH_FAILED:
      "We couldn't load the help articles. Please refresh the page and try again.",
    HELP_ARTICLE_CREATE_FAILED:
      "We couldn't create the help article. Please try again or contact support.",
    HELP_ARTICLE_FETCH_FAILED:
      "We couldn't load the help article. Please refresh the page and try again.",
    HELP_ARTICLE_UPDATE_FAILED:
      "We couldn't update the help article. Please try again or contact support.",
    HELP_ARTICLE_DELETE_FAILED:
      "We couldn't delete the help article. Please try again or contact support.",
    HELP_CATEGORIES_FETCH_FAILED:
      "We couldn't load the help categories. Please refresh the page and try again.",
    HELP_CATEGORY_CREATE_FAILED:
      "We couldn't create the help category. Please try again or contact support.",
    HELP_CATEGORY_FETCH_FAILED:
      "We couldn't load the help category. Please refresh the page and try again.",
    HELP_CATEGORY_UPDATE_FAILED:
      "We couldn't update the help category. Please try again or contact support.",
    HELP_CATEGORY_DELETE_FAILED:
      "We couldn't delete the help category. Please try again or contact support.",

    // Onboarding Survey
    ONBOARDING_SURVEY_SUBMIT_FAILED:
      "We couldn't submit your survey. Please try again or contact support.",
    ONBOARDING_SURVEY_CHECK_FAILED:
      "We couldn't check your survey status. Please refresh the page and try again.",

    // SKU Generation
    SKU_GENERATION_FAILED:
      "We couldn't generate a SKU for your product. Please try again or contact support.",

    // Product Status & Validation
    PRODUCT_STATUS_UPDATE_FAILED:
      "We couldn't update your product status. Please try again or contact support.",
    PRODUCT_VALIDATION_FAILED:
      "We couldn't validate your product. Please check your input and try again.",

    // Policies
    PROHIBITED_ITEMS_POLICY_FETCH_FAILED:
      "We couldn't load the prohibited items policy. Please refresh the page and try again.",
    PROHIBITED_ITEMS_POLICY_UPDATE_FAILED:
      "We couldn't update the prohibited items policy. Please try again or contact support.",
    TERMS_OF_SERVICE_FETCH_FAILED:
      "We couldn't load the terms of service. Please refresh the page and try again.",
    TERMS_OF_SERVICE_UPDATE_FAILED:
      "We couldn't update the terms of service. Please try again or contact support.",

    // Referrals
    REFERRAL_STATS_FETCH_FAILED:
      "We couldn't load your referral statistics. Please refresh the page and try again.",

    // Reports
    REPORT_CREATE_FAILED:
      "We couldn't submit your report. Please try again or contact support.",
    REPORTS_FETCH_FAILED:
      "We couldn't load the reports. Please refresh the page and try again.",
    REPORT_UPDATE_FAILED:
      "We couldn't update the report. Please try again or contact support.",
    REPORT_FETCH_FAILED:
      "We couldn't load the report. Please refresh the page and try again.",

    // Socket/Session
    SESSION_UPDATE_FAILED:
      "We couldn't update your session. Please refresh the page and try again.",

    // States/Provinces
    STATES_FETCH_FAILED:
      "We couldn't load the states/provinces data. Please refresh the page and try again.",
    STATES_SEARCH_FAILED:
      "We couldn't search for states/provinces. Please try again or contact support.",

    // Order Session
    ORDER_SESSION_FETCH_FAILED:
      "We couldn't load your order details. Please try again or contact support.",

    // Auth Routes
    AUTH_PERMISSIONS_FETCH_FAILED:
      "We couldn't load your permissions. Please refresh the page and try again.",
    AUTH_ROLE_FETCH_FAILED:
      "We couldn't load your role information. Please refresh the page and try again.",
    AUTH_CLEAR_CACHE_FAILED:
      "We couldn't clear your permission cache. Please refresh the page and try again.",

    // Seller About Actions
    SELLER_ABOUT_UPDATE_FAILED:
      "We couldn't update your shop information. Please try again or contact support.",
    SELLER_ABOUT_FETCH_FAILED:
      "We couldn't load your shop information. Please refresh the page and try again.",
    SHOP_NAMING_STEP_CHECK_FAILED:
      "We couldn't complete your shop profile setup. Please try again or contact support.",

    // Onboarding Actions
    ONBOARDING_STEPS_RECALCULATE_FAILED:
      "We couldn't update your onboarding progress. Please refresh the page and try again.",
    ONBOARDING_SHOP_COUNTRY_UPDATE_FAILED:
      "We couldn't update your shop country. Please try again or contact support.",
    ONBOARDING_SHIPPING_EXCLUSIONS_UPDATE_FAILED:
      "We couldn't update your shipping exclusions. Please try again or contact support.",
    ONBOARDING_HELP_PREFERENCES_SAVE_FAILED:
      "We couldn't save your help preferences. Please try again or contact support.",
    ONBOARDING_HELP_PREFERENCES_ANALYTICS_FAILED:
      "We couldn't load analytics data. Please try again or contact support.",
    ONBOARDING_GET_USERS_BY_CATEGORY_FAILED:
      "We couldn't load user data. Please try again or contact support.",
    ONBOARDING_GET_HELP_PREFERENCES_FAILED:
      "We couldn't load your help preferences. Please refresh the page and try again.",
    ONBOARDING_SHOP_PREFERENCES_SAVE_FAILED:
      "We couldn't save your shop preferences. Please try again or contact support.",
    ONBOARDING_SHOP_NAME_SAVE_FAILED:
      "We couldn't save your shop name. Please try again or contact support.",
    ONBOARDING_FIRST_PRODUCT_CREATE_FAILED:
      "We couldn't create your first product. Please try again or contact support.",
    ONBOARDING_STRIPE_SETUP_FAILED:
      "We couldn't set up your Stripe account. Please try again or contact support.",
    ONBOARDING_FIRST_NAME_SAVE_FAILED:
      "We couldn't save your first name. Please try again or contact support.",
    ONBOARDING_GET_FIRST_NAME_FAILED:
      "We couldn't load your first name. Please refresh the page and try again.",

    // Contact Actions
    CONTACT_RESPONSE_SEND_FAILED:
      "We couldn't send the response email. Please try again or contact support.",
    CONTACT_US_SUBMIT_FAILED:
      "We couldn't submit your contact form. Please try again or contact support.",

    // Purchases
    PURCHASES_FETCH_FAILED:
      "We couldn't load your purchases. Please refresh the page and try again.",

    // Product Actions
    PRODUCT_ACTION_CREATE_FAILED:
      "We couldn't create your product. Please try again or contact support.",
    FOUNDING_SELLER_STATUS_FETCH_FAILED:
      "We couldn't load your founding seller status. Please refresh the page and try again.",
    FOUNDING_SELLER_ELIGIBILITY_CHECK_FAILED:
      "We couldn't check your founding seller eligibility. Please refresh the page and try again.",

    // Admin Actions
    ADMIN_GET_USERS_FAILED:
      "We couldn't load the users. Please refresh the page and try again.",
    ADMIN_GET_ALL_SELLERS_FAILED:
      "We couldn't load all seller applications. Please refresh the page and try again.",
    ADMIN_GET_APPROVED_SELLERS_FAILED:
      "We couldn't load approved seller applications. Please refresh the page and try again.",
    ADMIN_GET_UNAPPROVED_SELLERS_FAILED:
      "We couldn't load unapproved seller applications. Please refresh the page and try again.",
    ADMIN_APPROVE_APPLICATION_FAILED:
      "We couldn't approve the seller application. Please try again or contact support.",
    ADMIN_REJECT_APPLICATION_FAILED:
      "We couldn't reject the seller application. Please try again or contact support.",
    ADMIN_GET_ALL_USERS_FAILED:
      "We couldn't load all users. Please refresh the page and try again.",
    ADMIN_GET_USER_PERMISSIONS_FAILED:
      "We couldn't load user permissions. Please refresh the page and try again.",
    ADMIN_ADD_USER_PERMISSION_FAILED:
      "We couldn't add the permission. Please try again or contact support.",
    ADMIN_REMOVE_USER_PERMISSION_FAILED:
      "We couldn't remove the permission. Please try again or contact support.",
    ADMIN_GET_DASHBOARD_STATS_FAILED:
      "We couldn't load dashboard statistics. Please refresh the page and try again.",
    ADMIN_GET_RECENT_ACTIVITY_FAILED:
      "We couldn't load recent activity. Please refresh the page and try again.",
    ADMIN_CREATE_ADMIN_FAILED:
      "We couldn't create the admin account. Please try again or contact support.",
    ADMIN_GET_ADMIN_BY_USER_ID_FAILED:
      "We couldn't load the admin information. Please refresh the page and try again.",
    ADMIN_UPDATE_ADMIN_ROLE_FAILED:
      "We couldn't update the admin role. Please try again or contact support.",
    ADMIN_DEACTIVATE_ADMIN_FAILED:
      "We couldn't deactivate the admin account. Please try again or contact support.",
    ADMIN_UPDATE_NOTIFICATION_PREFERENCES_FAILED:
      "We couldn't update notification preferences. Please try again or contact support.",
    ADMIN_ADD_TASK_FAILED:
      "We couldn't add the task. Please try again or contact support.",
    ADMIN_UPDATE_TASK_FAILED:
      "We couldn't update the task. Please try again or contact support.",
    ADMIN_REMOVE_TASK_FAILED:
      "We couldn't remove the task. Please try again or contact support.",
    ADMIN_GET_ADMINS_FOR_NOTIFICATION_FAILED:
      "We couldn't load admins for notifications. Please try again or contact support.",
    ADMIN_SETUP_NOTIFICATIONS_FAILED:
      "We couldn't set up notifications. Please try again or contact support.",
    ADMIN_GET_CONTACT_SUBMISSIONS_FAILED:
      "We couldn't load contact submissions. Please refresh the page and try again.",
    ADMIN_GET_CONTACT_SUBMISSION_BY_ID_FAILED:
      "We couldn't load the contact submission. Please refresh the page and try again.",
    ADMIN_UPDATE_USER_ROLE_FAILED:
      "We couldn't update the user role. Please try again or contact support.",
  };

  // Return user-friendly message or generic one
  return (
    userMessages[code] ||
    "Something went wrong. Please try again or contact support."
  );
}

/**
 * Helper to wrap async functions with error logging
 *
 * Note: This uses logError which is fire-and-forget, so it won't break your app.
 *
 * @example
 * ```ts
 * export const createProduct = withErrorLogging(
 *   async (data: ProductData) => {
 *     // product creation logic
 *   },
 *   {
 *     code: "PRODUCT_CREATE_FAILED",
 *     getUserId: (data) => data.userId,
 *     getRoute: () => "/api/products/create-product",
 *   }
 * );
 * ```
 */
export function withErrorLogging<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: {
    code: string;
    getUserId?: (...args: T) => string | null | undefined;
    getRoute?: (...args: T) => string | undefined;
    getMethod?: (...args: T) => string | undefined;
    getMetadata?: (...args: T) => Record<string, any> | undefined;
  }
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const userId = options.getUserId?.(...args);
      const route = options.getRoute?.(...args);
      const method = options.getMethod?.(...args);
      const metadata = options.getMetadata?.(...args);

      // logError is synchronous and fire-and-forget, so it won't break the app
      const userMessage = logError({
        code: options.code,
        userId: userId || undefined,
        route,
        method,
        error,
        metadata,
      });

      // Re-throw with user-friendly message
      throw new Error(userMessage);
    }
  };
}

/**
 * reCAPTCHA verification utility
 * Provides server-side verification of reCAPTCHA tokens
 */

export interface RecaptchaVerificationResult {
  success: boolean;
  score?: number;
  action?: string;
  error?: string;
}

/**
 * Verify a reCAPTCHA token on the server side
 * @param token - The reCAPTCHA token from the client
 * @param action - The action that was performed (e.g., 'checkout', 'register')
 * @param minScore - Minimum score threshold (default: 0.5)
 * @returns Promise<RecaptchaVerificationResult>
 */
export async function verifyRecaptcha(
  token: string,
  action?: string,
  minScore: number = 0.5
): Promise<RecaptchaVerificationResult> {
  // Skip reCAPTCHA verification in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log("Development mode: Skipping reCAPTCHA verification");
    return {
      success: true,
      score: 1.0,
      action: action || 'development',
    };
  }

  if (!token) {
    return {
      success: false,
      error: "reCAPTCHA token is required",
    };
  }

  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    console.error("reCAPTCHA secret key not configured");
    return {
      success: false,
      error: "reCAPTCHA not configured",
    };
  }

  try {
    const response = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`reCAPTCHA API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Log the response for debugging (remove in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log("reCAPTCHA verification response:", {
        success: data.success,
        score: data.score,
        action: data.action,
        challenge_ts: data.challenge_ts,
        hostname: data.hostname,
      });
    }

    // Check if verification was successful
    if (!data.success) {
      return {
        success: false,
        error: "reCAPTCHA verification failed",
        score: data.score,
        action: data.action,
      };
    }

    // Check score threshold
    if (data.score < minScore) {
      return {
        success: false,
        error: `reCAPTCHA score too low: ${data.score} (minimum: ${minScore})`,
        score: data.score,
        action: data.action,
      };
    }

    // Check action if specified
    if (action && data.action !== action) {
      return {
        success: false,
        error: `reCAPTCHA action mismatch: expected '${action}', got '${data.action}'`,
        score: data.score,
        action: data.action,
      };
    }

    return {
      success: true,
      score: data.score,
      action: data.action,
    };
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get reCAPTCHA configuration for client-side use
 */
export function getRecaptchaConfig() {
  return {
    siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
    isDevelopment: process.env.NODE_ENV === 'development',
  };
} 
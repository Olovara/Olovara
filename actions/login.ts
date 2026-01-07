"use server";

import * as z from "zod";
import { AuthError } from "next-auth";
import { headers } from "next/headers";

import { LoginSchema } from "@/schemas";
import { signIn } from "@/auth";
import { getUserByEmail } from "@/data/user";

import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import {
  generateVerificationToken,
  generateTwoFactorToken,
} from "@/lib/tokens";
import { sendVerificationEmail, sendTwoFactorTokenEmail } from "@/lib/mail";
import { getTwoFactorTokenByEmail } from "@/data/two-factor-token";
import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";

/**
 * Helper function to get client IP and user agent for logging
 */
async function getRequestContext() {
  const headersList = await headers();
  const forwarded = headersList.get('x-forwarded-for');
  const realIP = headersList.get('x-real-ip');
  const cfConnectingIP = headersList.get('cf-connecting-ip');
  const xClientIP = headersList.get('x-client-ip');
  const userAgent = headersList.get('user-agent');
  
  // Try different IP headers in order of preference
  let clientIP = '';
  if (cfConnectingIP) {
    clientIP = cfConnectingIP;
  } else if (realIP) {
    clientIP = realIP;
  } else if (xClientIP) {
    clientIP = xClientIP;
  } else if (forwarded) {
    clientIP = forwarded.split(',')[0].trim();
  }
  
  return { clientIP, userAgent };
}

/**
 * Censor email for logging - shows first 3 chars and domain
 * Example: "user@example.com" -> "use***@example.com"
 */
function censorEmail(email: string | undefined | null): string {
  if (!email) return "unknown";
  const [localPart, domain] = email.split('@');
  if (!domain) return "***";
  if (localPart.length <= 3) {
    return `${localPart[0]}***@${domain}`;
  }
  return `${localPart.substring(0, 3)}***@${domain}`;
}

export const login = async (
  values: z.infer<typeof LoginSchema>,
  callbackUrl?: string | null
) => {
  // Get request context for logging (IP, user agent)
  const requestContext = await getRequestContext();
  const { clientIP, userAgent } = requestContext;
  
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    logError({
      code: "LOGIN_VALIDATION_FAILED",
      route: "actions/login",
      method: "POST",
      metadata: {
        validationErrors: validatedFields.error.format(),
        attemptedEmail: censorEmail(values.email),
        clientIP,
        userAgent,
        callbackUrl: callbackUrl || null,
        timestamp: new Date().toISOString(),
        reason: "Schema validation failed",
      },
      message: "Login validation failed",
    });
    return { error: "Invalid fields" };
  }

  let { email, password, code } = validatedFields.data;
  
  // Normalize email to lowercase for consistent lookups
  // This prevents case-sensitivity issues (e.g., "User@Email.com" vs "user@email.com")
  email = email.trim().toLowerCase();

  const existingUser = await getUserByEmail(email);

  // Check if user exists but doesn't have a password (OAuth-only user)
  if (existingUser && existingUser.email && !existingUser.password) {
    // Check if they have a Google account linked
    const googleAccount = await db.account.findFirst({
      where: {
        userId: existingUser.id,
        provider: "google",
      },
    });

    if (googleAccount) {
      logError({
        code: "LOGIN_OAUTH_ONLY_USER",
        userId: existingUser.id,
        route: "actions/login",
        method: "POST",
        metadata: {
          email: censorEmail(email),
          userId: existingUser.id,
          provider: "google",
          clientIP,
          userAgent,
          callbackUrl: callbackUrl || null,
          timestamp: new Date().toISOString(),
          reason: "OAuth-only user attempted email/password login",
        },
        message: "OAuth-only user attempted email/password login",
      });
      return { 
        error: "This account was created with Google. Please use the 'Sign in with Google' button instead of email/password login." 
      };
    }

    // Generic OAuth message if we can't determine the provider
    logError({
      code: "LOGIN_OAUTH_ONLY_USER_UNKNOWN_PROVIDER",
      userId: existingUser.id,
      route: "actions/login",
      method: "POST",
      metadata: {
        email: censorEmail(email),
        userId: existingUser.id,
        clientIP,
        userAgent,
        callbackUrl: callbackUrl || null,
        timestamp: new Date().toISOString(),
        reason: "OAuth-only user attempted email/password login (unknown provider)",
      },
      message: "OAuth-only user attempted email/password login",
    });
    return { 
      error: "This account was created with a social login provider. Please use the social login button to sign in." 
    };
  }

  // User doesn't exist at all
  if (!existingUser || !existingUser.email) {
    logError({
      code: "LOGIN_USER_NOT_FOUND",
      route: "actions/login",
      method: "POST",
      metadata: {
        email: censorEmail(email),
        clientIP,
        userAgent,
        callbackUrl: callbackUrl || null,
        timestamp: new Date().toISOString(),
        reason: "User not found in database",
      },
      message: "Login attempted with non-existent email",
    });
    return { error: "No account found with this email. Please check your email or register for a new account." };
  }

  if (!existingUser.emailVerified) {
    logError({
      code: "LOGIN_EMAIL_NOT_VERIFIED",
      userId: existingUser.id,
      route: "actions/login",
      method: "POST",
      metadata: {
        email: censorEmail(email),
        userId: existingUser.id,
        clientIP,
        userAgent,
        callbackUrl: callbackUrl || null,
        timestamp: new Date().toISOString(),
        reason: "User attempted login with unverified email",
      },
      message: "Login attempted with unverified email",
    });
    
    try {
      const verificationToken = await generateVerificationToken(
        existingUser.email
      );

      await sendVerificationEmail(
        verificationToken.email,
        verificationToken.token
      );
    } catch (error) {
      logError({
        code: "LOGIN_VERIFICATION_EMAIL_FAILED",
        userId: existingUser.id,
        route: "actions/login",
        method: "POST",
        error,
        metadata: {
          email: censorEmail(email),
          userId: existingUser.id,
          clientIP,
          userAgent,
          timestamp: new Date().toISOString(),
          reason: "Failed to send verification email",
        },
        message: "Failed to send verification email during login",
      });
    }

    return { success: "Verification email sent!" };
  }

  if (existingUser.isTwoFactorEnabled && existingUser.email) {
    if (code) {
      const twoFactorToken = await getTwoFactorTokenByEmail(existingUser.email);

      if (!twoFactorToken || twoFactorToken.token !== code) {
        logError({
          code: "LOGIN_2FA_INVALID_CODE",
          userId: existingUser.id,
          route: "actions/login",
          method: "POST",
          metadata: {
            email: censorEmail(email),
            userId: existingUser.id,
            clientIP,
            userAgent,
            callbackUrl: callbackUrl || null,
            hasToken: !!twoFactorToken,
            codeLength: code?.length || 0,
            timestamp: new Date().toISOString(),
            reason: "Invalid 2FA code provided",
          },
          message: "Invalid 2FA code during login",
        });
        return { error: "Invalid code!" };
      }

      const hasExpired = new Date(twoFactorToken.expires) < new Date();

      if (hasExpired) {
        logError({
          code: "LOGIN_2FA_CODE_EXPIRED",
          userId: existingUser.id,
          route: "actions/login",
          method: "POST",
          metadata: {
            email: censorEmail(email),
            userId: existingUser.id,
            clientIP,
            userAgent,
            callbackUrl: callbackUrl || null,
            tokenExpires: twoFactorToken.expires.toISOString(),
            currentTime: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            reason: "Expired 2FA code provided",
          },
          message: "Expired 2FA code during login",
        });
        return { error: "Code expired!" };
      }

      await db.twoFactorToken.delete({
        where: { id: twoFactorToken.id },
      });

      const existingConfirmation = await getTwoFactorConfirmationByUserId(
        existingUser.id
      );

      if (existingConfirmation) {
        await db.twoFactorConfirmation.delete({
          where: { id: existingConfirmation.id },
        });
      }

      await db.twoFactorConfirmation.create({
        data: {
          userId: existingUser.id,
        },
      });
    } else {
      const twoFactorToken = await generateTwoFactorToken(existingUser.email);
      await sendTwoFactorTokenEmail(twoFactorToken.email, twoFactorToken.token);

      return { twoFactor: true };
    }
  }

  try {
    // signIn() with redirect: false returns void on success, throws on error
    // We handle redirect client-side since server actions can't redirect
    await signIn("credentials", {
      email,
      password,
      redirect: false, // Don't redirect from server action - handle client-side
    });

    // If we get here, login was successful
    // Return success with redirect URL for client to handle
    return {
      success: "Login successful!",
      redirectTo: callbackUrl || DEFAULT_LOGIN_REDIRECT
    };
  } catch (error: any) {
    // Handle AuthError with proper type checking
    if (error instanceof AuthError) {
      // Check if error has a type property before accessing it
      const errorType = (error as any)?.type || (error as any)?.cause?.type;

      switch (errorType) {
        case "CredentialsSignin":
          logError({
            code: "LOGIN_INVALID_CREDENTIALS",
            userId: existingUser.id,
            route: "actions/login",
            method: "POST",
            metadata: {
              email: censorEmail(email),
              userId: existingUser.id,
              clientIP,
              userAgent,
              callbackUrl: callbackUrl || null,
              errorType,
              timestamp: new Date().toISOString(),
              reason: "Invalid password provided",
            },
            message: "Invalid credentials during login",
          });
          return { error: "Invalid credentials!" };
        case "MissingCSRF":
          logError({
            code: "LOGIN_CSRF_TOKEN_MISSING",
            userId: existingUser.id,
            route: "actions/login",
            method: "POST",
            metadata: {
              email: censorEmail(email),
              userId: existingUser.id,
              clientIP,
              userAgent,
              callbackUrl: callbackUrl || null,
              errorType,
              timestamp: new Date().toISOString(),
              reason: "CSRF token missing or invalid",
            },
            message: "CSRF token missing during login",
          });
          return { error: "Security token missing. Please refresh the page and try again." };
        default:
          logError({
            code: "LOGIN_AUTH_ERROR",
            userId: existingUser.id,
            route: "actions/login",
            method: "POST",
            error,
            metadata: {
              email: censorEmail(email),
              userId: existingUser.id,
              clientIP,
              userAgent,
              callbackUrl: callbackUrl || null,
              errorType,
              timestamp: new Date().toISOString(),
              reason: `Auth error: ${errorType || "Unknown"}`,
            },
            message: "Authentication error during login",
          });
          return { error: "Something went wrong during sign in!" };
      }
    }

    // For non-AuthError exceptions, log and return generic error
    logError({
      code: "LOGIN_UNEXPECTED_ERROR",
      userId: existingUser?.id,
      route: "actions/login",
      method: "POST",
      error,
      metadata: {
        email: censorEmail(email),
        userId: existingUser?.id,
        clientIP,
        userAgent,
        callbackUrl: callbackUrl || null,
        errorType: error?.constructor?.name || typeof error,
        timestamp: new Date().toISOString(),
        reason: "Unexpected error during login",
      },
      message: "Unexpected error during login",
    });
    return { error: "An unexpected error occurred. Please try again." };
  }
};
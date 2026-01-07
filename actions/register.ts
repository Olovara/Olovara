"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";

import { RegisterSchema } from "@/schemas";
import { db } from "@/lib/db";
import { getUserByEmail, getUserByUsername, normalizeUsername } from "@/data/user";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";
import { createRolePermissions, ROLES } from "@/data/roles-and-permissions";
import { getUserLocationPreferences } from "@/lib/ipinfo";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { generateReferralCode } from "@/lib/utils";
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

/**
 * Censor username for logging - shows first 2 chars
 * Example: "username123" -> "us***"
 */
function censorUsername(username: string | undefined | null): string {
  if (!username) return "unknown";
  if (username.length <= 2) {
    return "***";
  }
  return `${username.substring(0, 2)}***`;
}

export const register = async (values: z.infer<typeof RegisterSchema>, redirectTo?: string) => {
  // Get request context for logging (IP, user agent)
  const requestContext = await getRequestContext();
  const { clientIP, userAgent } = requestContext;
  
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    // Log validation error with context (censored)
    logError({
      code: "REGISTER_VALIDATION_FAILED",
      route: "actions/register",
      method: "POST",
      metadata: {
        validationErrors: validatedFields.error.format(),
        attemptedEmail: censorEmail(values.email),
        attemptedUsername: censorUsername(values.username),
        clientIP,
        userAgent,
        timestamp: new Date().toISOString(),
        reason: "Schema validation failed",
      },
      message: "Registration validation failed",
    });
    return { error: "Invalid fields." };
  }

  let { username, password, email, recaptchaToken } = validatedFields.data;
  
  // Normalize email to lowercase for consistent storage and lookups
  // This prevents case-sensitivity issues (e.g., "User@Email.com" vs "user@email.com")
  email = email.trim().toLowerCase();
  
  // Trim username but preserve case for display
  // We'll create a normalized version for lookups while keeping original for display
  username = username.trim();
  
  // Create normalized username for case-insensitive lookups
  const normalizedUsername = username.toLowerCase();

  // Check honeypot field
  if (validatedFields.data.website) {
    // Log bot detection (censored) - detailed logging for internal use
    logError({
      code: "REGISTER_BOT_DETECTED",
      route: "actions/register",
      method: "POST",
      metadata: {
        email: censorEmail(email),
        username: censorUsername(username),
        clientIP,
        userAgent,
        honeypotFilled: true,
        timestamp: new Date().toISOString(),
        reason: "Honeypot field was filled (bot detected)",
      },
      message: "Bot detected during registration",
    });
    // Return generic error that looks like a normal validation error
    // Don't reveal bot detection tactics
    return { error: "Invalid fields." };
  }

  // Check if username contains "yarnnu" (case-insensitive)
  if (username.toLowerCase().includes("yarnnu")) {
    logError({
      code: "REGISTER_INVALID_USERNAME",
      route: "actions/register",
      method: "POST",
      metadata: {
        email: censorEmail(email),
        username: censorUsername(username),
        clientIP,
        userAgent,
        timestamp: new Date().toISOString(),
        reason: "Username contains 'yarnnu' which is not allowed",
      },
      message: "Invalid username attempted",
    });
    return { error: "Username cannot contain 'Yarnnu'." };
  }

  // Get location preferences for the user
  let locationData = null;
  let preferredCurrency = 'USD'; // Default currency
  try {
    if (clientIP) {
      const locationPreferences = await getUserLocationPreferences(clientIP);
      locationData = {
        country: locationPreferences.countryCode,
        countryName: locationPreferences.countryName,
        continent: locationPreferences.continent,
      };
      preferredCurrency = locationPreferences.currency;
      
      // Debug logging
      console.log('Registration location detection:', {
        ip: clientIP,
        countryCode: locationPreferences.countryCode,
        countryName: locationPreferences.countryName,
        detectedCurrency: locationPreferences.currency,
        isSupported: locationPreferences.isSupported
      });
    } else {
      console.log('No client IP available for location detection during registration');
    }
  } catch (error) {
    console.error('Error getting location preferences during registration:', error);
    // Don't fail registration if location detection fails
  }

  console.log('Final preferred currency for registration:', preferredCurrency);

  // Verify reCAPTCHA
  const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'register', 0.5);
  if (!recaptchaResult.success) {
    logError({
      code: "REGISTER_RECAPTCHA_FAILED",
      route: "actions/register",
      method: "POST",
      metadata: {
        email: censorEmail(email),
        username: censorUsername(username),
        clientIP,
        userAgent,
        recaptchaError: recaptchaResult.error,
        recaptchaScore: recaptchaResult.score,
        timestamp: new Date().toISOString(),
        reason: `reCAPTCHA verification failed: ${recaptchaResult.error || "Unknown error"}`,
      },
      message: "reCAPTCHA verification failed during registration",
    });
    return { error: "reCAPTCHA verification failed. Please try again." };
  }

  // Rate limiting by IP
  const rateLimitResult = rateLimit(email, 5, 60 * 1000); // 5 attempts per minute
  if (!rateLimitResult.success) {
    const waitTime = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
    logError({
      code: "REGISTER_RATE_LIMIT_EXCEEDED",
      route: "actions/register",
      method: "POST",
      metadata: {
        email: censorEmail(email),
        username: censorUsername(username),
        clientIP,
        userAgent,
        rateLimitReset: new Date(rateLimitResult.reset).toISOString(),
        waitTimeSeconds: waitTime,
        timestamp: new Date().toISOString(),
        reason: `Rate limit exceeded: ${waitTime} seconds remaining`,
      },
      message: "Registration rate limit exceeded",
    });
    return { 
      error: `Too many attempts. Please try again in ${waitTime} seconds.` 
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Check for existing email
  const existingUserByEmail = await getUserByEmail(email);
  if (existingUserByEmail) {
    logError({
      code: "REGISTER_EMAIL_EXISTS",
      route: "actions/register",
      method: "POST",
      metadata: {
        email: censorEmail(email),
        username: censorUsername(username),
        clientIP,
        userAgent,
        existingUserId: existingUserByEmail.id,
        timestamp: new Date().toISOString(),
        reason: "Email already registered",
      },
      message: "Registration attempted with existing email",
    });
    return { error: "Email already exists." };
  }

  // Check for existing username (using normalized version for case-insensitive lookup)
  const existingUserByUsername = await getUserByUsername(normalizedUsername);
  if (existingUserByUsername) {
    // Check if the email matches the existing account
    const emailMatches = existingUserByUsername.email?.toLowerCase() === email.toLowerCase();
    
    logError({
      code: "REGISTER_USERNAME_EXISTS",
      route: "actions/register",
      method: "POST",
      metadata: {
        email: censorEmail(email),
        username: censorUsername(username),
        normalizedUsername: censorUsername(normalizedUsername),
        clientIP,
        userAgent,
        existingUserId: existingUserByUsername.id,
        existingUserEmail: censorEmail(existingUserByUsername.email),
        emailMatches,
        timestamp: new Date().toISOString(),
        reason: emailMatches 
          ? "Username already taken, but email matches existing account - user should login instead"
          : "Username already taken with different email",
      },
      message: "Registration attempted with existing username",
    });
    
    // If email matches, suggest they try logging in instead
    if (emailMatches) {
      return { error: "This username is already taken. If this is your account, please try logging in instead." };
    }
    
    // If email doesn't match, suggest different username
    return { error: "This username is already taken. Please choose a different username." };
  }

  // Generate a unique referral code with retry logic
  let referralCode: string = '';
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 20;

  while (!isUnique && attempts < maxAttempts) {
    referralCode = generateReferralCode();
    
    try {
      // Check if the referral code already exists
      const existingUser = await db.user.findUnique({
        where: { referralCode },
        select: { id: true }
      });
      
      if (!existingUser) {
        isUnique = true;
      } else {
        attempts++;
        console.log(`Referral code ${referralCode} already exists, trying again...`);
      }
    } catch (error) {
      // If there's an error checking, assume it's not unique and try again
      attempts++;
      console.log(`Error checking referral code ${referralCode}, trying again...`);
    }
  }

  if (!isUnique) {
    logError({
      code: "REGISTER_REFERRAL_CODE_GENERATION_FAILED",
      route: "actions/register",
      method: "POST",
      metadata: {
        email: censorEmail(email),
        username: censorUsername(username),
        clientIP,
        userAgent,
        maxAttempts,
        timestamp: new Date().toISOString(),
        reason: `Failed to generate unique referral code after ${maxAttempts} attempts`,
      },
      message: "Referral code generation failed",
    });
    return { error: `Unable to generate unique referral code after ${maxAttempts} attempts` };
  }

  let newUserId: string | null = null;
  
  try {
    // Create user in database
    // Store both original username (for display) and normalizedUsername (for lookups)
    const newUser = await db.user.create({
      data: {
        username, // Original username with preserved case for display
        normalizedUsername, // Lowercase, trimmed version for case-insensitive lookups
        email,
        password: hashedPassword,
        role: ROLES.MEMBER,
        permissions: createRolePermissions(ROLES.MEMBER),
        referralCode,
        signupIP: clientIP || null,
        signupLocation: locationData,
        lastLoginIP: clientIP || null,
        lastLoginAt: new Date(),
        preferredCurrency: preferredCurrency,
      },
    });
    
    newUserId = newUser.id;
  } catch (error) {
    logError({
      code: "REGISTER_DATABASE_CREATE_FAILED",
      route: "actions/register",
      method: "POST",
      error,
      metadata: {
        email: censorEmail(email),
        username: censorUsername(username),
        clientIP,
        userAgent,
        locationData,
        preferredCurrency,
        timestamp: new Date().toISOString(),
        reason: "Database error while creating user",
      },
      message: "Failed to create user in database",
    });
    return { error: "Failed to create account. Please try again." };
  }

  try {
    const verificationToken = await generateVerificationToken(email);
    
    // If user wants to become a seller, include redirect parameter
    const verificationUrl = redirectTo 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/new-verification?token=${verificationToken.token}&redirect=${encodeURIComponent(redirectTo)}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/new-verification?token=${verificationToken.token}`;
    
    await sendVerificationEmail(verificationToken.email, verificationToken.token, verificationUrl);
  } catch (error) {
    // Log email sending failure but don't fail registration (user is already created)
    logError({
      code: "REGISTER_VERIFICATION_EMAIL_FAILED",
      userId: newUserId,
      route: "actions/register",
      method: "POST",
      error,
      metadata: {
        email: censorEmail(email),
        username: censorUsername(username),
        userId: newUserId,
        clientIP,
        userAgent,
        timestamp: new Date().toISOString(),
        reason: "Failed to send verification email (user already created)",
      },
      message: "Verification email failed to send",
    });
    // Still return success since user was created
    // User can request a new verification email
  }

  return { success: "Successfully registered. Verify your email!" };
};
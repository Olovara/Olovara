"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";

import { RegisterSchema } from "@/schemas";
import { db } from "@/lib/db";
import { getUserByEmail, getUserByUsername } from "@/data/user";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";
import { createRolePermissions, ROLES } from "@/data/roles-and-permissions";
import { getUserLocationPreferences } from "@/lib/ipinfo";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { generateReferralCode } from "@/lib/utils";

export const register = async (values: z.infer<typeof RegisterSchema>, redirectTo?: string) => {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields." };
  }

  // Check honeypot field
  if (validatedFields.data.website) {
    return { error: "Invalid submission." };
  }

  const { username, password, email, recaptchaToken } = validatedFields.data;

  // Get client IP address for location detection and fraud prevention
  const headersList = await headers();
  const forwarded = headersList.get('x-forwarded-for');
  const realIP = headersList.get('x-real-ip');
  const cfConnectingIP = headersList.get('cf-connecting-ip'); // Cloudflare
  const xClientIP = headersList.get('x-client-ip');
  
  // Try different IP headers in order of preference
  let clientIP = '';
  if (cfConnectingIP) {
    clientIP = cfConnectingIP;
  } else if (realIP) {
    clientIP = realIP;
  } else if (xClientIP) {
    clientIP = xClientIP;
  } else if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    clientIP = forwarded.split(',')[0].trim();
  }

  console.log('IP detection during registration:', {
    cfConnectingIP,
    realIP,
    xClientIP,
    forwarded,
    finalClientIP: clientIP
  });

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
    return { error: "reCAPTCHA verification failed. Please try again." };
  }

  // Rate limiting by IP (you'll need to pass the IP from your API route)
  const rateLimitResult = rateLimit(email, 5, 60 * 1000); // 5 attempts per minute
  if (!rateLimitResult.success) {
    return { 
      error: `Too many attempts. Please try again in ${Math.ceil((rateLimitResult.reset - Date.now()) / 1000)} seconds.` 
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Check for existing email
  const existingUserByEmail = await getUserByEmail(email);
  if (existingUserByEmail) {
    return { error: "Email already exists." };
  }

  // Check for existing username
  const existingUserByUsername = await getUserByUsername(username);
  if (existingUserByUsername) {
    return { error: "Username already exists." };
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
    return { error: `Unable to generate unique referral code after ${maxAttempts} attempts` };
  }

  console.log(`Generated unique referral code for new user: ${referralCode}`);

  await db.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      role: ROLES.MEMBER,
      permissions: createRolePermissions(ROLES.MEMBER),
      referralCode, // Add the generated referral code
      // Store IP and location information for fraud detection
      signupIP: clientIP || null,
      signupLocation: locationData,
      lastLoginIP: clientIP || null,
      lastLoginAt: new Date(),
      // Set preferred currency based on detected location
      preferredCurrency: preferredCurrency,
    },
  });

  const verificationToken = await generateVerificationToken(email);
  
  // If user wants to become a seller, include redirect parameter
  const verificationUrl = redirectTo 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/new-verification?token=${verificationToken.token}&redirect=${encodeURIComponent(redirectTo)}`
    : `${process.env.NEXT_PUBLIC_APP_URL}/new-verification?token=${verificationToken.token}`;
  
  await sendVerificationEmail(verificationToken.email, verificationToken.token, verificationUrl);

  return { success: "Successfully registered. Verify your email!" };
};
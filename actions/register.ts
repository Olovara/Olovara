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

const verifyRecaptcha = async (token: string) => {
  // Skip reCAPTCHA verification on localhost for development
  if (process.env.NODE_ENV === 'development') {
    console.log("Development mode: Skipping reCAPTCHA verification");
    return true;
  }

  try {
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY!,
          response: token,
        }),
      }
    );

    const data = await response.json();
    
    // Log the response for debugging
    console.log("reCAPTCHA response:", data);
    
    // Check if the verification was successful and the score is above threshold
    return data.success && data.score >= 0.5;
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return false;
  }
};

export const register = async (values: z.infer<typeof RegisterSchema>) => {
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
  const clientIP = forwarded?.split(',')[0] || realIP || '';

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
    }
  } catch (error) {
    console.error('Error getting location preferences during registration:', error);
    // Don't fail registration if location detection fails
  }

  // Verify reCAPTCHA
  const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
  if (!isRecaptchaValid) {
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

  await db.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      role: ROLES.MEMBER,
      permissions: createRolePermissions(ROLES.MEMBER),
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
  await sendVerificationEmail(verificationToken.email, verificationToken.token);

  return { success: "Successfully registered. Verify your email!" };
};
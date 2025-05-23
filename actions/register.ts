"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";

import { RegisterSchema } from "@/schemas";
import { db } from "@/lib/db";
import { getUserByEmail, getUserByUsername } from "@/data/user";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";

const verifyRecaptcha = async (token: string) => {
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
    },
  });

  const verificationToken = await generateVerificationToken(email);
  await sendVerificationEmail(verificationToken.email, verificationToken.token);

  return { success: "Successfully registered. Verify your email!" };
};
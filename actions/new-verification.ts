"use server";

import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import { getVerificationTokenByToken } from "@/data/verification-token";

export const newVerification = async (token: string) => {
  const startTime = Date.now();
  
  try {
    console.log("[Verification] Starting verification process:", {
      token,
      timestamp: new Date().toISOString(),
      startTime,
    });

    const existingToken = await getVerificationTokenByToken(token);

    if (!existingToken) {
      return { error: "Verification link is invalid or has expired. Please request a new verification email." };
    }

    const hasExpired = new Date(existingToken.expires) < new Date();

    if (hasExpired) {
      console.log("[Verification] Token expired:", {
        token,
        expires: existingToken.expires,
        timestamp: new Date().toISOString(),
      });
      
      // Delete expired token
      await db.verificationToken.delete({
        where: { id: existingToken.id },
      });
      return { error: "Verification link has expired. Please request a new verification email." };
    }

    const existingUser = await getUserByEmail(existingToken.email);

    if (!existingUser) {
      return { error: "User not found. Please try registering again." };
    }

    // Check if email is already verified
    if (existingUser.emailVerified) {
      return { success: "Email is already verified. You can now log in." };
    }

    // Update user and delete token in a transaction
    await db.$transaction([
      db.user.update({
        where: { id: existingUser.id },
        data: {
          emailVerified: new Date(),
          email: existingToken.email,
        },
      }),
      db.verificationToken.delete({
        where: { id: existingToken.id },
      }),
    ]);

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log("[Verification] Successfully verified email:", {
      email: existingToken.email,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    return { success: "Email verified successfully! You can now log in." };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.error("[Verification] Error during verification:", {
      error,
      token,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
    return { error: "An error occurred during verification. Please try again." };
  }
};
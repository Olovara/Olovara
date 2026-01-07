import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

import { db } from "@/lib/db";
import { getVerificationTokenByEmail } from "@/data/verification-token";
import { getPasswordResetTokenByEmail } from "@/data/password-reset-token";
import { getTwoFactorTokenByEmail } from "@/data/two-factor-token";

export const generateTwoFactorToken = async (email: string) => {
  // Normalize email to lowercase for consistent storage
  const normalizedEmail = email.trim().toLowerCase();
  const token = crypto.randomInt(100_000, 1_000_000).toString();
  const expires = new Date(new Date().getTime() + 5 * 60 * 1000);

  const existingToken = await getTwoFactorTokenByEmail(normalizedEmail);

  if (existingToken) {
    await db.twoFactorToken.delete({
      where: {
        id: existingToken.id,
      },
    });
  }

  const twoFactorToken = await db.twoFactorToken.create({
    data: {
      email: normalizedEmail,
      token,
      expires,
    },
  });

  return twoFactorToken;
};

export const generatePasswordResetToken = async (email: string) => {
  // Normalize email to lowercase for consistent storage
  const normalizedEmail = email.trim().toLowerCase();
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 3600 * 1000);

  const existingToken = await getPasswordResetTokenByEmail(normalizedEmail);

  if (existingToken) {
    await db.passwordResetToken.delete({
      where: { id: existingToken.id },
    });
  }

  const passwordResetToken = await db.passwordResetToken.create({
    data: {
      email: normalizedEmail,
      token,
      expires,
    },
  });

  return passwordResetToken;
};

export const generateVerificationToken = async (email: string) => {
  // Normalize email to lowercase for consistent storage
  const normalizedEmail = email.trim().toLowerCase();
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 24 * 3600 * 1000);

  try {
    const existingToken = await getVerificationTokenByEmail(normalizedEmail);

    if (existingToken) {
      await db.verificationToken.delete({
        where: {
          id: existingToken.id,
        },
      });
    }

    const verificationToken = await db.verificationToken.create({
      data: {
        email: normalizedEmail,
        token,
        expires,
      },
    });

    return verificationToken;
  } catch (error) {
    console.error("Error generating verification token:", error);
    throw new Error("Failed to generate verification token");
  }
};
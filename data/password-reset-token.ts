import { db } from "@/lib/db";

export const getPasswordResetTokenByToken = async (token: string) => {
  try {
    const passwordResetToken = await db.passwordResetToken.findUnique({
      where: { token },
    });

    return passwordResetToken;
  } catch {
    return null;
  }
};

export const getPasswordResetTokenByEmail = async (email: string) => {
  try {
    // Normalize email to lowercase for case-insensitive lookup
    const normalizedEmail = email.trim().toLowerCase();
    const passwordResetToken = await db.passwordResetToken.findFirst({
      where: { email: normalizedEmail },
    });

    return passwordResetToken;
  } catch {
    return null;
  }
};
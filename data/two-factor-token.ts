import { db } from "@/lib/db";

export const getTwoFactorTokenByToken = async (token: string) => {
  try {
    const twoFactorToken = await db.twoFactorToken.findUnique({
      where: { token },
    });

    return twoFactorToken;
  } catch {
    return null;
  }
};

export const getTwoFactorTokenByEmail = async (email: string) => {
  try {
    // Normalize email to lowercase for case-insensitive lookup
    const normalizedEmail = email.trim().toLowerCase();
    const twoFactorToken = await db.twoFactorToken.findFirst({
      where: { email: normalizedEmail },
    });

    return twoFactorToken;
  } catch {
    return null;
  }
};
// Don't import bcrypt at top level - it uses Node.js APIs not available in Edge Runtime
// Middleware imports this file, so we need to dynamically import bcrypt only when needed
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { LoginSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";

// Validate OAuth environment variables
// Missing or empty values will cause "Configuration" errors
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const authSecret = process.env.AUTH_SECRET;

const hasGoogleOAuth = Boolean(googleClientId && googleClientSecret);

// Env vars are not available in the browser bundle (only NEXT_PUBLIC_* are inlined).
// Logging here on the client always looked like "MISSING" even when .env.local is correct.
if (typeof window === "undefined") {
  const shouldValidate =
    process.env.NODE_ENV !== "production" ||
    process.env.VALIDATE_AUTH_ENV === "true";

  if (shouldValidate) {
    if (!hasGoogleOAuth) {
      console.error(
        "[AUTH CONFIG] ⚠️  Missing Google OAuth credentials (server).",
        "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local to enable Google sign-in.",
        { GOOGLE_CLIENT_ID: googleClientId ? "SET" : "MISSING", GOOGLE_CLIENT_SECRET: googleClientSecret ? "SET" : "MISSING" }
      );
    }

    if (!authSecret) {
      console.error(
        "[AUTH CONFIG] ⚠️  Missing AUTH_SECRET (server). Add it to .env.local — required for session encryption."
      );
    }
  }
}

export const authConfig = {
  providers: [
    ...(hasGoogleOAuth
      ? [
          Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            // Note: allowDangerousEmailAccountLinking is false by default (secure)
            // This prevents account takeover if someone signs up with OAuth using an email
            // that already has a password account. Users must use their original login method.
          }),
        ]
      : []),
    Credentials({
      async authorize(credentials) {
        try {
          const validatedFields = LoginSchema.safeParse(credentials);

          if (!validatedFields.success) {
            console.error("[auth] Credentials validation failed:", validatedFields.error.format());
            return null;
          }

          const { email, password } = validatedFields.data;

          // Normalize email to lowercase for consistent lookups
          // This prevents case-sensitivity issues (e.g., "User@Email.com" vs "user@email.com")
          const normalizedEmail = email.trim().toLowerCase();

          const user = await getUserByEmail(normalizedEmail);
          if (!user) {
            console.error("[auth] User not found for email:", normalizedEmail);
            return null;
          }

          if (!user.password) {
            console.error("[auth] User has no password (OAuth-only user):", email);
            return null;
          }

          // Dynamically import bcrypt only when needed (runs in Node.js API route, not Edge)
          // This prevents Edge Runtime bundling errors
          const bcrypt = (await import("bcryptjs")).default;
          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (!passwordsMatch) {
            console.error("[auth] Password mismatch for email:", email);
            return null;
          }

          return user;
        } catch (error) {
          console.error("[auth] Unexpected error in authorize:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/error",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.isOAuth = !!account;

        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          include: {
            seller: {
              select: {
                id: true,
                applicationAccepted: true,
                stripeConnected: true,
                isFullyActivated: true,
              },
            },
          },
        });

        if (dbUser) {
          // Only include essential auth data in JWT (no role, no permissions)
          token.isTwoFactorEnabled = dbUser.isTwoFactorEnabled;

          // Include seller onboarding fields in token
          if (dbUser.seller) {
            token.sellerOnboarding = {
              sellerId: dbUser.seller.id,
              applicationAccepted: dbUser.seller.applicationAccepted,
              stripeConnected: dbUser.seller.stripeConnected,
              isFullyActivated: dbUser.seller.isFullyActivated,
            };
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        // Role is now fetched via API, not stored in session
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
        session.user.isOAuth = token.isOAuth as boolean;

        // Include seller onboarding fields in session
        if (token.sellerOnboarding) {
          session.user.sellerOnboarding = token.sellerOnboarding as {
            sellerId: string;
            applicationAccepted: boolean;
            stripeConnected: boolean;
            isFullyActivated: boolean;
          };
        }
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  secret: authSecret,
} satisfies NextAuthConfig;

export default authConfig;

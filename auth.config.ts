// Don't import bcrypt at top level - it uses Node.js APIs not available in Edge Runtime
// Middleware imports this file, so we need to dynamically import bcrypt only when needed
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { LoginSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;

          const user = await getUserByEmail(email);
          if (!user || !user.password) return null;

          // Dynamically import bcrypt only when needed (runs in Node.js API route, not Edge)
          // This prevents Edge Runtime bundling errors
          const bcrypt = (await import("bcryptjs")).default;
          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) {
            return user;
          }
        }

        return null;
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
  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;

export default authConfig;

// Edge-compatible auth config for middleware (no Prisma)
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Minimal config for Edge runtime (middleware)
// Full auth logic with Prisma is in auth.config.ts

// Validate OAuth environment variables
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const authSecret = process.env.AUTH_SECRET;

export const authConfigEdge = {
  providers: [
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/error",
  },
  session: {
    strategy: "jwt",
  },
  secret: authSecret,
} satisfies NextAuthConfig;

export default authConfigEdge;

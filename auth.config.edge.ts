// Edge-compatible auth config for middleware (no Prisma)
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Minimal config for Edge runtime (middleware)
// Full auth logic with Prisma is in auth.config.ts
export const authConfigEdge = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/error",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;

export default authConfigEdge;

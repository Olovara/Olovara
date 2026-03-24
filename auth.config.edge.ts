// Edge-compatible auth config for middleware (no Prisma)
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

// Minimal config for Edge runtime (middleware)
// Full auth logic with Prisma is in auth.config.ts

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const authSecret = process.env.AUTH_SECRET;

const hasGoogleOAuth = Boolean(googleClientId && googleClientSecret);

// NextAuth expects at least one provider; middleware only verifies JWTs.
const edgeProviders = hasGoogleOAuth
  ? [
      Google({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      }),
    ]
  : [
      Credentials({
        id: "edge-session-only",
        name: "Credentials",
        credentials: {},
        async authorize() {
          return null;
        },
      }),
    ];

export const authConfigEdge = {
  providers: edgeProviders,
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

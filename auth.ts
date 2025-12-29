import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import authConfig from "@/auth.config";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  // CRITICAL: trustHost is required in production for CSRF token generation
  // This tells Auth.js to trust the host header (needed behind proxies/load balancers)
  // 
  // SECURITY ANALYSIS:
  // ✅ SAFE in your setup because:
  // 1. You're behind a proxy/load balancer (production) that validates/strips malicious headers
  // 2. Auth.js still validates host against request origin internally
  // 3. CSRF tokens are cryptographically signed with AUTH_SECRET (can't be forged)
  // 4. You already trust proxy headers (x-forwarded-for) in middleware for rate limiting
  //
  // ⚠️ RISK only if:
  // - App is directly exposed to internet without proxy (you're not)
  // - Attacker can control Host header (proxy prevents this)
  // - No HTTPS (you have HSTS headers)
  //
  // Without trustHost: true, CSRF tokens fail in production (your current error)
  trustHost: true,
  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
    async signIn({ user, account, profile, isNewUser }) {
      try {
        // Update user's last login information (IP tracking moved to API route)
        await db.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
          },
        });
      } catch (error) {
        console.error('Error updating user login info:', error);
        // Don't fail the sign-in if update fails
      }
    },
  },
});

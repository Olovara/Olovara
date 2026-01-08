import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import authConfig from "@/auth.config";
import { logError } from "@/lib/error-logger";
import type { Adapter } from "@auth/core/adapters";

// Custom adapter that maps OAuth 'name' field to 'username'
// PrismaAdapter expects 'name' but our schema uses 'username'
const customAdapter: Adapter = {
  ...PrismaAdapter(db),
  async createUser(user) {
    // Map 'name' to 'username' and create normalizedUsername
    const { name, ...userWithoutName } = user as any;
    
    // If name exists, use it as username
    // Otherwise, generate a username from email or use a default
    let username = name;
    if (!username && user.email) {
      // Generate username from email (e.g., "user@example.com" -> "user")
      username = user.email.split('@')[0];
    }
    if (!username) {
      // Fallback: use a generated username
      username = `user_${Date.now()}`;
    }
    
    // Create normalized username
    const normalizedUsername = username.trim().toLowerCase();
    
    // Create user with username instead of name
    // Only include fields that exist in our schema
    const createdUser = await db.user.create({
      data: {
        email: user.email || null,
        emailVerified: user.emailVerified || null,
        image: user.image || null,
        username,
        normalizedUsername,
        role: "MEMBER",
        permissions: [],
      },
    });
    
    return {
      id: createdUser.id,
      email: createdUser.email || null,
      emailVerified: createdUser.emailVerified,
      name: username, // Return name for NextAuth compatibility
      image: createdUser.image || null,
    } as any;
  },
};

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  adapter: customAdapter,
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
    async linkAccount({ user, account }) {
      try {
        // Verify account exists in database
        // This event fires AFTER PrismaAdapter creates the Account record
        // Check by provider and providerAccountId since account.id might not be available or might be wrong type
        if (account?.provider && account?.providerAccountId) {
          const dbAccount = await db.account.findFirst({
            where: {
              userId: user.id,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          });
          
          if (!dbAccount) {
            // Account record missing - this is a problem!
            logError({
              code: "OAUTH_ACCOUNT_RECORD_MISSING",
              userId: user.id,
              route: "auth.ts/events/linkAccount",
              method: "POST",
              metadata: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                timestamp: new Date().toISOString(),
                reason: "Account record not found in database after PrismaAdapter should have created it",
              },
              message: "OAuth Account record missing from database",
            });
          }
        }

        await db.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
      } catch (error) {
        // Log error but don't fail the account linking
        logError({
          code: "OAUTH_LINK_ACCOUNT_FAILED",
          userId: user.id,
          route: "auth.ts/events/linkAccount",
          method: "POST",
          error,
          metadata: {
            provider: account?.provider || "unknown",
            providerAccountId: account?.providerAccountId || "unknown",
            accountId: account?.id ? String(account.id) : "unknown",
            timestamp: new Date().toISOString(),
            reason: "Failed to update emailVerified during account linking",
          },
          message: "Failed to link OAuth account",
        });
      }
    },
    async signIn({ user, account, profile, isNewUser }) {
      try {
        // Update user's last login information (IP tracking moved to API route)
        const updateData: any = {
          lastLoginAt: new Date(),
        };
        
        // OAuth users (Google, etc.) should always have verified emails
        // Google already verifies emails, so we trust OAuth providers
        // This fixes the issue where OAuth users might not have emailVerified set
        if (account) {
          // This is an OAuth sign-in (Google, etc.)
          // Automatically verify email since OAuth providers already verify emails
          updateData.emailVerified = new Date();

          // Check if Account record exists in database
          // PrismaAdapter should have created it, but let's verify
          const accountRecord = await db.account.findFirst({
            where: {
              userId: user.id,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          });

          if (!accountRecord) {
            // Account record missing - PrismaAdapter may have failed
            logError({
              code: "OAUTH_ACCOUNT_RECORD_MISSING_ON_SIGNIN",
              userId: user.id,
              route: "auth.ts/events/signIn",
              method: "POST",
              metadata: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                isNewUser,
                email: user.email ? `${user.email.substring(0, 3)}***@${user.email.split('@')[1]}` : "unknown",
                timestamp: new Date().toISOString(),
                reason: "Account record not found in database - PrismaAdapter may have failed to create it",
              },
              message: "OAuth Account record missing on sign-in",
            });
          }
        }
        
        // Check if user has username but no normalizedUsername, and set it if missing
        // This handles OAuth users and ensures normalizedUsername is always set
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { username: true, normalizedUsername: true, emailVerified: true },
        });
        
        // If user has username but normalizedUsername is missing, set it
        if (dbUser?.username && !dbUser.normalizedUsername) {
          const normalized = dbUser.username.trim().toLowerCase();
          updateData.normalizedUsername = normalized;
        }
        
        await db.user.update({
          where: { id: user.id },
          data: updateData,
        });
      } catch (error) {
        // Log error but don't fail the sign-in
        logError({
          code: "OAUTH_SIGNIN_UPDATE_FAILED",
          userId: user.id,
          route: "auth.ts/events/signIn",
          method: "POST",
          error,
          metadata: {
            provider: account?.provider || "unknown",
            isNewUser,
            email: user.email ? `${user.email.substring(0, 3)}***@${user.email.split('@')[1]}` : "unknown",
            timestamp: new Date().toISOString(),
            reason: "Failed to update user info during OAuth sign-in",
          },
          message: "Failed to update user info during OAuth sign-in",
        });
      }
    },
  },
});

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

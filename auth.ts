import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { db } from "@/lib/db";
import authConfig from "./auth.config";
import { getUserById } from "./data/user";
import { getTwoFactorConfirmationByUserId } from "./data/two-factor-confirmation";
import { getAccountByUserId } from "./data/account";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  pages: {
    signIn: "/login",
    error: "/error",
  },
  events: {
    async linkAccount({ user }) {
      if (user.id) {
        // Ensure user.id is defined and valid before updating
        await db.user.update({
          where: { id: user.id }, // Proceed if user.id is valid
          data: { emailVerified: new Date() },
        });
      } else {
        console.error("User ID is undefined.");
        // Optionally handle the case where user.id is undefined
      }
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // Allow OAuth without email verification
      if (account?.provider !== "credentials") return true;

      // Ensure user.id is valid before proceeding
      if (!user.id) {
        console.error("User ID is undefined");
        return false; // Or handle the error as needed
      }

      const existingUser = await getUserById(user.id);

      // Prevent sign in without email verification
      if (!existingUser?.emailVerified) return false;

      if (existingUser.isTwoFactorEnabled) {
        const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(
          existingUser.id
        );

        if (!twoFactorConfirmation) return false;

        // Delete two factor confirmation for next sign in
        await db.twoFactorConfirmation.delete({
          where: { id: twoFactorConfirmation.id },
        });
      }

      return true;
    },

    async session({ token, session }) {
      if (!token || !session.user) return session;

      // Assign values to session.user
      session.user.id = token.sub || session.user.id;
      session.user.role = token.role || session.user.role;
      session.user.isOAuth = token.isOAuth ?? false; // Default to `false` if undefined
      session.user.isTwoFactorEnabled = token.isTwoFactorEnabled ?? false;
      session.user.username = token.username || session.user.username;
      session.user.email = token.email || session.user.email;

      return session;
    },

    async jwt({ token }) {
      if (!token.sub) return token;

      try {
        // Fetch user details
        const existingUser = await getUserById(token.sub);
        if (!existingUser) return token;

        // Fetch account details to check if OAuth
        const existingAccount = await getAccountByUserId(existingUser.id);

        // Add properties to the token
        token.isOAuth = !!existingAccount;
        token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled ?? false;
        token.username = existingUser.username || "";
        token.email = existingUser.email || "";
        token.role = existingUser.role;

        return token;
      } catch (error) {
        console.error("Error in JWT callback:", error);
        return token; // Return token as is in case of error
      }
    },
  },

  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  ...authConfig,
});

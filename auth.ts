import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { db } from "@/lib/db";
import authConfig from "./auth.config";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
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
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  ...authConfig,
});

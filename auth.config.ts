import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { UserRole } from "@prisma/client";
import type { User } from "@prisma/client";

import { LoginSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";

// Extend the User type to include role
interface ExtendedUser extends User {
  role: UserRole;
}

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (!validatedFields.success) {
          return null;
        }

        const { email, password } = validatedFields.data;

        const user = await getUserByEmail(email);
        if (!user || !user.password) return null;

        const passwordsMatch = await bcrypt.compare(password, user.password);

        if (passwordsMatch) return user;

        return null;
      },
    }),
  ],
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/error",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      console.log("JWT Callback:", {
        hasUser: !!user,
        hasToken: !!token,
        trigger,
        hasSession: !!session,
        userRole: (user as ExtendedUser)?.role,
        tokenRole: token?.role
      });

      if (user) {
        const typedUser = user as ExtendedUser;
        if (typedUser.role) {
          token.role = typedUser.role;
        }
        if (typedUser.id) {
          token.id = typedUser.id;
        }
      }
      
      // Refresh token on session update
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }
      
      return token;
    },
    async session({ session, token }) {
      console.log("Session Callback:", {
        hasSession: !!session,
        hasToken: !!token,
        sessionUser: session?.user,
        tokenRole: token?.role
      });

      if (session?.user) {
        session.user.role = token.role as UserRole;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session age every 24 hours
  },
  secret: process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
} satisfies NextAuthConfig;
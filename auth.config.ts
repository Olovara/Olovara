import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { UserRole } from "@prisma/client";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { JWT } from "next-auth/jwt";


// Extend the User type to include role
interface ExtendedUser {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
}

// Extend the JWT type to include role
interface ExtendedJWT extends JWT {
  id: string;
  role: UserRole;
}

// Define credentials type
interface Credentials {
  email: string;
  password: string;
}

const authConfig = {
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordsMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          role: user.role,
        } as ExtendedUser;
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
        tokenRole: (token as ExtendedJWT)?.role
      });

      if (user) {
        // When signing in, update token with user data
        const typedUser = user as ExtendedUser;
        return {
          ...token,
          id: typedUser.id,
          role: typedUser.role,
          email: typedUser.email,
          name: typedUser.name,
        } as ExtendedJWT;
      } else if (trigger === "update" && session) {
        // When updating session, sync with database
        const dbUser = await db.user.findUnique({
          where: { id: token.sub },
          select: { role: true }
        });
        
        if (dbUser) {
          return {
            ...token,
            role: dbUser.role,
          } as ExtendedJWT;
        }
      }

      return token as ExtendedJWT;
    },
    async session({ session, token }) {
      console.log("Session Callback:", {
        hasSession: !!session,
        hasToken: !!token,
        sessionUser: session.user,
        tokenRole: (token as ExtendedJWT)?.role
      });

      if (token) {
        const typedToken = token as ExtendedJWT;
        session.user.id = typedToken.id;
        session.user.role = typedToken.role;
        session.user.email = typedToken.email;
        session.user.name = typedToken.name;
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

export default authConfig;
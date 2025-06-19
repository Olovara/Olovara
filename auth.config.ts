import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { LoginSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { getUserPermissions } from "@/lib/permissions";

// Extend the User type to include role
interface ExtendedUser {
  id: string;
  email: string | null;
  name?: string | null;
  role: UserRole;
  permissions: string[];
  isTwoFactorEnabled: boolean;
  isOAuth: boolean;
}

const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;
          
          const user = await getUserByEmail(email);
          if (!user || !user.password) return null;

          const passwordsMatch = await bcrypt.compare(
            password,
            user.password,
          );

          if (passwordsMatch) {
            // Get user permissions
            const permissions = await getUserPermissions(user.id);
            
            // Construct the user object with all required properties
            const extendedUser: ExtendedUser = {
              id: user.id,
              email: user.email,
              name: user.username,
              role: user.role,
              permissions: permissions.map(p => p.toString()),
              isTwoFactorEnabled: user.isTwoFactorEnabled,
              isOAuth: false, // This is a credentials login, so it's not OAuth
            };

            return extendedUser;
          }
        }

        return null;
      }
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const extendedUser = user as ExtendedUser;
        token.id = extendedUser.id;
        token.role = extendedUser.role;
        token.permissions = extendedUser.permissions;
        token.isTwoFactorEnabled = extendedUser.isTwoFactorEnabled;
        token.isOAuth = extendedUser.isOAuth;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.permissions = token.permissions;
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled;
        session.user.isOAuth = token.isOAuth;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;

export default authConfig;
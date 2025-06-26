import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { Role } from "@/data/roles-and-permissions";
import { db } from "@/lib/db";
import { LoginSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { getUserPermissions } from "@/lib/permissions";

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
            return user;
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
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.isOAuth = !!account;

        const dbUser = await db.user.findUnique({ 
          where: { id: user.id },
          include: {
            seller: {
              select: {
                applicationAccepted: true,
                stripeConnected: true,
                shopProfileComplete: true,
                shippingProfileCreated: true,
                isFullyActivated: true,
              }
            }
          }
        });

        if (dbUser) {
          const permissions = await getUserPermissions(dbUser.id);
          token.role = dbUser.role as Role;
          token.permissions = permissions;
          token.isTwoFactorEnabled = dbUser.isTwoFactorEnabled;
          
          // Include seller onboarding fields in token
          if (dbUser.seller) {
            token.sellerOnboarding = {
              applicationAccepted: dbUser.seller.applicationAccepted,
              stripeConnected: dbUser.seller.stripeConnected,
              shopProfileComplete: dbUser.seller.shopProfileComplete,
              shippingProfileCreated: dbUser.seller.shippingProfileCreated,
              isFullyActivated: dbUser.seller.isFullyActivated,
            };
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.permissions = token.permissions as string[];
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
        session.user.isOAuth = token.isOAuth as boolean;
        
        // Include seller onboarding fields in session
        if (token.sellerOnboarding) {
          session.user.sellerOnboarding = token.sellerOnboarding as {
            applicationAccepted: boolean;
            stripeConnected: boolean;
            shopProfileComplete: boolean;
            shippingProfileCreated: boolean;
            isFullyActivated: boolean;
          };
        }
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
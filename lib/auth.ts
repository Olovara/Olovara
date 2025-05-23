import { auth } from "@/auth";
import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import GoogleProvider from "next-auth/providers/google";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

export const currentUser = async () => {
  try {
    const session = await auth();
    if (!session?.user) {
      return null;
    }
    return session.user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

// A utility function to get the current role of the user
export const currentRole = async () => {
  try {
    const session = await auth(); // Retrieve the session

    if (!session) {
      throw new Error("No session found"); // You can throw an error if there's no session
    }

    return session.user?.role; // Return the user's role from the session if it exists
  } catch (error) {
    console.error("Error fetching current role:", error); // Log error for debugging
    return null; // You can also return `null` or `undefined` here to handle the error gracefully
  }
};
export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
  },
};

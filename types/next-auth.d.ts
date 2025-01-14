import NextAuth, { User as NextAuthUser } from "next-auth";
import { UserRole } from "@prisma/client";

interface User extends NextAuthUser {
  role: UserRole;
  isTwoFactorEnabled: boolean;
  isOAuth: boolean;
}

declare module "next-auth" {
  interface Session {
    user: {
      role: UserRole; // Add role here
      isTwoFactorEnabled: boolean;
      isOAuth: boolean;
    } & DefaultSession["user"];
  }

  interface JWT {
    role: UserRole; // Add role here
    isTwoFactorEnabled: boolean;
    isOAuth: boolean;
  }
}
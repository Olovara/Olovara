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
      id: string;
      role: UserRole;
      isTwoFactorEnabled: boolean;
      isOAuth: boolean;
    } & DefaultSession["user"];
  }

  interface JWT {
    id?: string;
    role: UserRole;
    isTwoFactorEnabled: boolean;
    isOAuth: boolean;
  }
}
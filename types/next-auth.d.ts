import NextAuth, { User as NextAuthUser } from "next-auth";
import { UserRole } from "@prisma/client";
import { Permission } from "@/types/permissions";

interface User extends NextAuthUser {
  role: UserRole;
  permissions: Permission[];
  isTwoFactorEnabled: boolean;
  isOAuth: boolean;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      permissions: Permission[];
      isTwoFactorEnabled: boolean;
      isOAuth: boolean;
    } & DefaultSession["user"];
  }

  interface JWT {
    id?: string;
    role: UserRole;
    permissions: Permission[];
    isTwoFactorEnabled: boolean;
    isOAuth: boolean;
  }
}
import { Role, Permission } from "@/data/roles-and-permissions";
import NextAuth, { type DefaultSession } from "next-auth";

export type ExtendedUser = DefaultSession["user"] & {
  role: Role;
  isTwoFactorEnabled: boolean;
  isOAuth: boolean;
  permissions: string[];
};

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    isTwoFactorEnabled?: boolean;
    isOAuth?: boolean;
    permissions?: string[];
  }
}
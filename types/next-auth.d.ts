import NextAuth, { type DefaultSession } from "next-auth";

export type ExtendedUser = DefaultSession["user"] & {
  // Role is now fetched via API, not stored in session
  isTwoFactorEnabled: boolean;
  isOAuth: boolean;
  sellerOnboarding?: {
    sellerId: string;
    applicationAccepted: boolean;
    stripeConnected: boolean;
    isFullyActivated: boolean;
  };
};

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    // Role is now fetched via API, not stored in JWT
    isTwoFactorEnabled?: boolean;
    isOAuth?: boolean;
    sellerOnboarding?: {
      sellerId: string;
      applicationAccepted: boolean;
      stripeConnected: boolean;
      isFullyActivated: boolean;
    };
  }
}
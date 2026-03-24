import { auth } from "@/auth";
import { PermissionProvider } from "@/components/providers/PermissionProvider";
import { SellerDashboardContent } from "./SellerDashboardContent";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { decryptData } from "@/lib/encryption";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Seller Dashboard | Manage Your Handmade Business | Yarnnu",
  description: "Manage your handmade business on Yarnnu. Track sales, manage products, handle orders, and grow your artisan shop. Complete dashboard for handmade sellers.",
  keywords: [
    "seller dashboard",
    "handmade business management",
    "artisan shop dashboard",
    "product management",
    "order management",
    "sales tracking",
    "handmade seller tools",
    "artisan business dashboard"
  ],
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SellerDashboardHome() {
  const session = await auth();
  
  // Server-side auth check - redirect if not authenticated
  // This is the REAL security check - middleware just prevents redirect loops
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/seller/dashboard");
  }

  // Fetch user role from database to verify seller access
  // This prevents redirect loops by checking role server-side
  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      username: true,
      createdAt: true,
      encryptedFirstName: true,
      firstNameIV: true,
      firstNameSalt: true,
      seller: {
        select: {
          id: true,
          applicationAccepted: true,
          createdAt: true,
        },
      },
    },
  });

  // If user is not a seller or doesn't have a seller profile, redirect appropriately
  if (!dbUser) {
    redirect("/login");
  }

  // Check if user has seller role OR has a seller profile (in case role update is pending)
  const isSeller = dbUser.role === "SELLER" || dbUser.seller !== null;

  if (!isSeller) {
    // User is authenticated but not a seller - redirect to seller application
    redirect("/seller-application");
  }

  let welcomeFirstName: string | null = null;
  if (
    dbUser.encryptedFirstName &&
    dbUser.firstNameIV &&
    dbUser.firstNameSalt
  ) {
    try {
      welcomeFirstName = decryptData(
        dbUser.encryptedFirstName,
        dbUser.firstNameIV,
        dbUser.firstNameSalt
      );
    } catch {
      welcomeFirstName = null;
    }
  }

  return (
    <PermissionProvider>
      <SellerDashboardContent
        welcomeFirstName={welcomeFirstName?.trim() || null}
        usernameFallback={dbUser.username?.trim() || null}
        sellerJoinedAt={(
          dbUser.seller?.createdAt ?? dbUser.createdAt
        ).toISOString()}
      />
    </PermissionProvider>
  );
}
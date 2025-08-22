import { auth } from "@/auth";
import { PermissionProvider } from "@/components/providers/PermissionProvider";
import { SellerDashboardContent } from "./SellerDashboardContent";
import { Metadata } from "next";

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
  
  if (!session?.user?.id) {
    return <div>Not authenticated</div>;
  }

  return (
    <PermissionProvider>
      <SellerDashboardContent />
    </PermissionProvider>
  );
}
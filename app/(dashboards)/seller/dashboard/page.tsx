import { auth } from "@/auth";
import { PermissionProvider } from "@/components/providers/PermissionProvider";
import { SellerDashboardContent } from "./SellerDashboardContent";


export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Seller - Dashboard",
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
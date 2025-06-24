import SellerDashboardSideNavbar from "./(components)/SellerDashboardSideNavbar";
import SellerDashboardTopNavbar from "./(components)/SellerDashboardTopNavbar";
import PermissionGate from "@/components/auth/permission-gate";
import { PERMISSIONS } from "@/data/roles-and-permissions";

export default function SellerDashboadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PermissionGate requiredPermission={"ACCESS_SELLER_DASHBOARD" as const}>
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <SellerDashboardSideNavbar />
      <SellerDashboardTopNavbar>
        <main className="flex flex-col gap-4 p-4 lg:gap-6">{children}</main>
      </SellerDashboardTopNavbar>
    </div>
    </PermissionGate>
  );
}
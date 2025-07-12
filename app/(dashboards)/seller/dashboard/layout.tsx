import SellerDashboardSideNavbar from "./(components)/SellerDashboardSideNavbar";
import SellerDashboardTopNavbar from "./(components)/SellerDashboardTopNavbar";
import { SellerRoute } from "@/components/shared/ProtectedRoute";

export default function SellerDashboadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SellerRoute>
      <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
        <SellerDashboardSideNavbar />
        <SellerDashboardTopNavbar>
          <main className="flex flex-col gap-4 p-4 lg:gap-6">{children}</main>
        </SellerDashboardTopNavbar>
      </div>
    </SellerRoute>
  );
}
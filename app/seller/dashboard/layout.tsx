import SellerDashboardSideNavbar from "./(components)/SellerDashboardSideNavbar";
import SellerDashboardTopNavbar from "./(components)/SellerDashboardTopNavbar";

export default function DashboadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <SellerDashboardSideNavbar />
      <SellerDashboardTopNavbar>
        <main className="flex flex-col gap-4 p-4 lg:gap-6">{children}</main>
      </SellerDashboardTopNavbar>
    </div>
  );
}
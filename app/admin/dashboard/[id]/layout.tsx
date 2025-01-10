import ShopDashboardSideNavbar from "./(components)/AdminDashboardSideNavbar";
import ShopDashboardTopNavbar from "./(components)/AdminDashboardTopNavbar";

export default function DashboadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <ShopDashboardSideNavbar />
      <ShopDashboardTopNavbar>
        <main className="flex flex-col gap-4 p-4 lg:gap-6">{children}</main>
      </ShopDashboardTopNavbar>
    </div>
  );
}
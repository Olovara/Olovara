import AdminDashboardSideNavbar from "./(components)/AdminDashboardSideNavbar";
import AdminDashboardTopNavbar from "./(components)/AdminDashboardTopNavbar";
import { AdminRoute } from "@/components/shared/ProtectedRoute";

export default function DashboadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminRoute>
      <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
        <AdminDashboardSideNavbar />
        <AdminDashboardTopNavbar>
          <main className="flex flex-col gap-4 p-4 lg:gap-6">{children}</main>
        </AdminDashboardTopNavbar>
      </div>
    </AdminRoute>
  );
}
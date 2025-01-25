import MemberDashboardSideNavbar from "./(components)/MemberDashboardSideNavbar";
import MemberDashboardTopNavbar from "./(components)/MemberDashboardTopNavbar";


export default function DashboadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <MemberDashboardSideNavbar />
      <MemberDashboardTopNavbar>
        <main className="flex flex-col gap-4 p-4 lg:gap-6">{children}</main>
      </MemberDashboardTopNavbar>
    </div>
  );
}
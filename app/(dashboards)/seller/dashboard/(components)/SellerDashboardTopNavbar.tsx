import { ReactNode } from "react";
import { UserNav } from "@/components/UserNav";
import { auth } from "@/auth";
import { getUserInfoForNav } from "@/actions/userActions";
import SellerDashboardMobileNav from "./SellerDashboardMobileNav";

export default async function SellerDashboardTopNavbar({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  const userInfo = session?.user ? await getUserInfoForNav() : null;

  return (
    <div className="flex flex-col">
      <header className="flex h-14 lg:h-[55px] items-center gap-4 border-b px-6 justify-between">
        <SellerDashboardMobileNav />

        <div className="ml-auto flex items-center gap-x-2">
          {userInfo ? <UserNav userInfo={userInfo} /> : <p>Loading...</p>}
        </div>
      </header>
      {children}
    </div>
  );
}

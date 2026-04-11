import Link from "next/link";
import { ChevronLeft, Home } from "lucide-react";
import { UserNav } from "@/components/UserNav";
import { auth } from "@/auth";
import { getUserInfoForNav } from "@/actions/userActions";
import { HelpCenterMobileNav } from "./HelpCenterMobileNav";

export async function HelpCenterNavbar() {
  const session = await auth();
  const userInfo = session?.user ? await getUserInfoForNav() : null;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Navigation */}
          <div className="flex items-center space-x-4">
            {/* Back to Help Center Home */}
            <Link
              href="/help-center"
              className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Help Center</span>
            </Link>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300" />

            {/* Back to OLOVARA Home */}
            <Link
              href="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="text-sm font-medium">OLOVARA Home</span>
            </Link>
          </div>

          {/* Right side - User Navigation */}
          <div className="flex items-center space-x-4">
            {userInfo && <UserNav userInfo={userInfo} />}
            {/* Mobile Menu Button */}
            <HelpCenterMobileNav />
          </div>
        </div>
      </div>
    </nav>
  );
}

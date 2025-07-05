import Link from "next/link";
import { NavbarLinks } from "./NavbarLinks";
import { UserNav } from "./UserNav";
import { Button } from "./ui/button";
import { MobileMenu } from "./MobileMenu";
import { auth } from "@/auth";
import { getUserInfoForNav } from "@/actions/userActions";
import LoginButton from "./auth/login-button";
import { SearchBar } from "./SearchBar";
import { ProtectedLink } from "./shared/ProtectedLink";

export async function Navbar() {
  const session = await auth();
  const userInfo = session?.user && (await getUserInfoForNav());

  return (
    <nav className="relative w-full py-4">
      {/* Top Row - Full Width */}
      <div className="flex items-center justify-between mb-4 px-4 md:px-8">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link href="/">
            <h1 className="text-2xl font-semibold">Yarnnu</h1>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-6xl mx-8">
          <SearchBar />
        </div>

        {/* Right Side - Buttons and Mobile Menu */}
        <div className="flex items-center gap-x-2">
          {/* Become a Seller Button - Only show for non-sellers */}
          {userInfo?.role !== "SELLER" && (
            <div className="hidden md:block">
              <ProtectedLink href="/seller-application">
                <Button variant="outline" className="text-black">
                  Become a Seller
                </Button>
              </ProtectedLink>
            </div>
          )}

          {/* Auth Buttons or User Nav */}
          {userInfo ? (
            <UserNav userInfo={userInfo} />
          ) : (
            <>
              <LoginButton mode="redirect">
                <Button variant="outline" className="text-black">
                  Login
                </Button>
              </LoginButton>
              <Link href="/register" passHref>
                <Button variant="outline" className="text-black">
                  Register
                </Button>
              </Link>
            </>
          )}

          {/* Mobile Menu */}
          <div className="md:hidden">
            <MobileMenu userInfo={userInfo} />
          </div>
        </div>
      </div>

      {/* Bottom Row - Categories Navigation */}
      <div className="hidden md:block border-t border-gray-200 pt-4 max-w-7xl mx-auto px-4 md:px-8">
        <NavbarLinks />
      </div>
    </nav>
  );
}

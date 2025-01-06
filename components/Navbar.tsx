import Link from "next/link";
import { NavbarLinks } from "./NavbarLinks";
import { UserNav } from "./UserNav";
import { Button } from "./ui/button";
import { MobileMenu } from "./MobileMenu";
import { auth } from "@/auth";
import LoginButton from "./auth/login-button";
import { getUserInfoForNav } from "@/actions/userActions";

export async function Navbar() {
  const session = await auth();
  const userInfo =
    session?.user && (await getUserInfoForNav());

  return (
    <nav className="relative max-w-7xl w-full flex md:grid md:grid-cols-12 items-center px-4 md:px-8 mx-auto py-7">
      <div className="md:col-span-3">
        <Link href="/">
          <h1 className="text-2xl font-semibold ">Yarnnu</h1>
        </Link>
      </div>

      <NavbarLinks />

      <div className="flex items-center gap-x-2 ms-auto md:col-span-3">
        {userInfo ? (
          <UserNav userInfo={userInfo} />
        ) : (
          <>
            <LoginButton mode="redirect">
              <Button variant="bordered" className="text-black">
                Login
              </Button>
            </LoginButton>
            <Button as={Link} href="/register" variant="bordered" className="text-black">
              Register
            </Button>
          </>
        )}

        <div className="md:hidden">
          <MobileMenu />
        </div>
      </div>
    </nav>
  );
}
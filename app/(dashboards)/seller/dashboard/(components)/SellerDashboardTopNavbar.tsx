import { ReactNode } from "react";
import { SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HomeIcon, Mail, Settings, Package, PackageOpen, CreditCard, Star } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { UserNav } from "@/components/UserNav";
import { auth } from "@/auth";
import { getUserInfoForNav } from "@/actions/userActions";

export default async function SellerDashboardTopNavbar({ children }: { children: ReactNode }) {
  const session = await auth(); // Fetch user session
  const userInfo = session?.user ? await getUserInfoForNav() : null;

  return (
    <div className="flex flex-col">
      <header className="flex h-14 lg:h-[55px] items-center gap-4 border-b px-6 justify-between">
        {/* Left Side - Menu Button */}
        <Dialog>
          <SheetTrigger className="min-[1024px]:hidden p-2 transition">
            <HamburgerMenuIcon />
            <span className="sr-only">Menu</span>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <Link href="/">
                <SheetTitle>Yarnnu</SheetTitle>
              </Link>
            </SheetHeader>
            <div className="flex flex-col space-y-3 mt-[1rem]">
              <DialogClose asChild>
                <Link href="/seller/dashboard">
                  <Button variant="outline" className="w-full">
                    <HomeIcon className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              </DialogClose>
              <DialogClose asChild>
                <Link href="/seller/dashboard/billing">
                  <Button variant="outline" className="w-full">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Billing
                  </Button>
                </Link>
              </DialogClose>
              <DialogClose asChild>
                <Link href="/seller/dashboard/products">
                  <Button variant="outline" className="w-full">
                    <Package className="mr-2 h-4 w-4" />
                    Products
                  </Button>
                </Link>
              </DialogClose>
              <DialogClose asChild>
                <Link href="/seller/dashboard/my-orders">
                  <Button variant="outline" className="w-full">
                    <Package className="mr-2 h-4 w-4" />
                    My Orders
                  </Button>
                </Link>
              </DialogClose>
              <DialogClose asChild>
                <Link href="/seller/dashboard/my-purchases">
                  <Button variant="outline" className="w-full">
                    <PackageOpen className="mr-2 h-4 w-4" />
                    My Purchases
                  </Button>
                </Link>
              </DialogClose>
              <DialogClose asChild>
                <Link href="/seller/dashboard/reviews">
                  <Button variant="outline" className="w-full">
                    <Star className="mr-2 h-4 w-4" />
                    Reviews
                  </Button>
                </Link>
              </DialogClose>
              <DialogClose asChild>
                <Link href="/seller/dashboard/messages">
                  <Button variant="outline" className="w-full">
                    <Mail className="mr-2 h-4 w-4" />
                    Messages
                  </Button>
                </Link>
              </DialogClose>
              <Separator className="my-3" />
              <DialogClose asChild>
                <Link href="/seller/dashboard/settings">
                  <Button variant="outline" className="w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </Link>
              </DialogClose>
            </div>
          </SheetContent>
        </Dialog>

        {/* Right Side - UserNav */}
        <div className="ml-auto"> {/* Push UserNav to the right */}
          {userInfo ? <UserNav userInfo={userInfo} /> : <p>Loading...</p>}
        </div>
      </header>
      {children}
    </div>
  );
}

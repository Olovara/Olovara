import { ReactNode } from "react";
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HomeIcon, Mail, Settings, FileQuestion, User, Package, ShoppingCart, BarChart3, Send, MessageSquare } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { UserNav } from "@/components/UserNav";
import { auth } from "@/auth";
import { getUserInfoForNav } from "@/actions/userActions";

export default async function AdminDashboardTopNavbar({
  children,
}: {
  children: ReactNode;
}) {
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
                <Link href="/admin/dashboard">
                  <Button variant="outline" className="w-full">
                    <HomeIcon className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              </DialogClose>
              <DialogClose asChild>
                <Link href="/admin/dashboard/seller-applications">
                  <Button variant="outline" className="w-full">
                    <FileQuestion className="mr-2 h-4 w-4" />
                    Seller Applications
                  </Button>
                </Link>
              </DialogClose>
              <DialogClose asChild>
                <Link href="/admin/dashboard/users">
                  <Button variant="outline" className="w-full">
                    <User className="mr-2 h-4 w-4" />
                    Users
                  </Button>
                </Link>
              </DialogClose>
              <DialogClose asChild>
                <Link href="/admin/dashboard/orders">
                  <Button variant="outline" className="w-full">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    All Orders
                  </Button>
                </Link>
              </DialogClose>
              <DialogClose asChild>
                <Link href="/admin/dashboard/products">
                  <Button variant="outline" className="w-full">
                    <Package className="mr-2 h-4 w-4" />
                    All Products
                  </Button>
                </Link>
              </DialogClose>
              <DialogClose asChild>
                <Link href="/admin/dashboard/messages">
                  <Button variant="outline" className="w-full">
                    <Mail className="mr-2 h-4 w-4" />
                    Messages
                  </Button>
                </Link>
              </DialogClose>
              <DialogClose asChild>
                <Link href="/admin/dashboard/contact-submissions">
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Contact Submissions
                  </Button>
                </Link>
              </DialogClose>
              <DialogClose asChild>
                <Link href="/admin/dashboard/newsletter">
                  <Button variant="outline" className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Newsletter
                  </Button>
                </Link>
              </DialogClose>
              <DialogClose asChild>
                <Link href="/admin/dashboard/onboarding-surveys">
                  <Button variant="outline" className="w-full">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Onboarding Surveys
                  </Button>
                </Link>
              </DialogClose>
              <Separator className="my-3" />
              <DialogClose asChild>
                <Link href="/admin/dashboard/settings">
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

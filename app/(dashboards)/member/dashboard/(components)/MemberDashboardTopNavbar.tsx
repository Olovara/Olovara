"use client";

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
import { HomeIcon, Mail, Settings, PackageOpen, Star, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function MemberDashboardTopNavbar({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <header className="flex h-14 lg:h-[55px] items-center gap-4 border-b px-6">
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
                <Link href="/member/dashboard">
                  <Button variant="outline" className="w-full">
                    <HomeIcon className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              </DialogClose>
              <DialogClose asChild>
                <Link href="/member/dashboard/my-purchases">
                  <Button variant="outline" className="w-full">
                    <PackageOpen className="mr-2 h-4 w-4" />
                    My Purchases
                  </Button>
                </Link>
              </DialogClose>
              <DialogClose asChild>
                <Link href="/member/dashboard/reviews">
                  <Button variant="outline" className="w-full">
                    <Star className="mr-2 h-4 w-4" />
                    Reviews
                  </Button>
                </Link>
              </DialogClose>
              <DialogClose asChild>
                <Link href="/member/dashboard/messages">
                  <Button variant="outline" className="w-full">
                    <Mail className="mr-2 h-4 w-4" />
                    Messages
                  </Button>
                </Link>
              </DialogClose>
              <DialogClose asChild>
                <Link href="/member/dashboard/blog">
                  <Button variant="outline" className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    Blog
                  </Button>
                </Link>
              </DialogClose>
              <Separator className="my-3" />
              <DialogClose asChild>
                <Link href="/member/dashboard/settings">
                  <Button variant="outline" className="w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </Link>
              </DialogClose>
            </div>
          </SheetContent>
        </Dialog>
      </header>
      {children}
    </div>
  );
}

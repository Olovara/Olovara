"use client";

import { logout } from "@/actions/logout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface iAppProps {
  userInfo: {
    email: string | null;
    username: string | null;
    image: string | undefined;
    role: "ADMIN" | "SELLER" | "MEMBER" | null;
    id: string;
  } | null;
}

export function UserNav({ userInfo }: iAppProps) {
  const roleRoutes = {
    ADMIN: "/admin/dashboard",
    SELLER: "/seller/dashboard",
    MEMBER: "/member/dashboard",
  };

  const settingsRoutes = {
    ADMIN: "/admin/dashboard/settings",
    SELLER: "/seller/dashboard/settings",
    MEMBER: "/member/dashboard/settings",
  };

  const dashboardRoute = userInfo?.role ? roleRoutes[userInfo.role] : null;
  const settingsRoute = userInfo?.role ? settingsRoutes[userInfo.role] : null;
  const isSeller = userInfo?.role === "SELLER";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={userInfo?.image} alt="User Image" />
            <AvatarFallback>{userInfo?.username?.[0] || "U"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{userInfo?.username || "Guest"}</p>
            <p className="text-xs text-muted-foreground">{userInfo?.email || "No email provided"}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {dashboardRoute && (
            <DropdownMenuItem asChild>
              <Link href={dashboardRoute}>Account</Link>
            </DropdownMenuItem>
          )}
          {settingsRoute && (
            <DropdownMenuItem asChild>
              <Link href={settingsRoute}>Settings</Link>
            </DropdownMenuItem>
          )}
          {isSeller && (
            <>
              <DropdownMenuItem asChild>
                <Link href="/seller/dashboard/products">My Products</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/seller/dashboard/my-orders">My Orders</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/seller/dashboard/billing">Billing</Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => logout()}>Log Out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

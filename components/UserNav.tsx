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
import { ProtectedLink } from "./shared/ProtectedLink";
import { useCurrentPermissions } from "@/hooks/use-current-permissions";
import { PERMISSIONS, Role } from "@/data/roles-and-permissions";

interface iAppProps {
  userInfo: {
    email: string | null;
    username: string | null;
    image: string | null;
    role: Role | null;
    id: string;
  } | null;
}

export function UserNav({ userInfo }: iAppProps) {
  const permissions = useCurrentPermissions();

  const canAccessAdminDashboard = permissions.includes(
    PERMISSIONS.ACCESS_ADMIN_DASHBOARD
  );
  const canAccessSellerDashboard = permissions.includes(
    PERMISSIONS.ACCESS_SELLER_DASHBOARD
  );
  const canAccessMemberDashboard = permissions.includes(
    PERMISSIONS.ACCESS_MEMBER_DASHBOARD
  );

  const canManageAdminSettings = permissions.includes(
    PERMISSIONS.MANAGE_ADMIN_SETTINGS
  );
  const canManageSellerSettings = permissions.includes(
    PERMISSIONS.MANAGE_SELLER_SETTINGS
  );
  const canManageMemberSettings = permissions.includes(
    PERMISSIONS.MANAGE_MEMBER_SETTINGS
  );

  const canManageProducts = permissions.includes(PERMISSIONS.MANAGE_PRODUCTS);
  const canViewOrders = permissions.includes(PERMISSIONS.VIEW_ORDERS);

  let dashboardRoute: string | null = null;
  if (userInfo?.role === "SUPER_ADMIN" || userInfo?.role === "ADMIN") {
    dashboardRoute = "/admin/dashboard";
  } else if (canAccessSellerDashboard) {
    dashboardRoute = "/seller/dashboard";
  } else if (canAccessMemberDashboard) {
    dashboardRoute = "/member/dashboard";
  }

  let settingsRoute: string | null = null;
  if (userInfo?.role === "SUPER_ADMIN" || userInfo?.role === "ADMIN") {
    settingsRoute = "/admin/dashboard/settings";
  } else if (canManageSellerSettings) {
    settingsRoute = "/seller/dashboard/settings";
  } else if (canManageMemberSettings) {
    settingsRoute = "/member/dashboard/settings";
  }

  const isSeller = canAccessSellerDashboard;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={userInfo?.image || undefined} alt="User Image" />
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
            <DropdownMenuItem>
              <ProtectedLink href={dashboardRoute} className="w-full">Account</ProtectedLink>
            </DropdownMenuItem>
          )}
          {settingsRoute && (
            <DropdownMenuItem>
              <ProtectedLink href={settingsRoute} className="w-full">Settings</ProtectedLink>
            </DropdownMenuItem>
          )}
          {canManageProducts && (
            <DropdownMenuItem>
              <ProtectedLink href="/seller/dashboard/products" className="w-full">My Products</ProtectedLink>
            </DropdownMenuItem>
          )}
          {isSeller && canViewOrders && (
            <DropdownMenuItem>
              <ProtectedLink href="/seller/dashboard/my-orders" className="w-full">My Orders</ProtectedLink>
            </DropdownMenuItem>
          )}
          {isSeller && (
            <DropdownMenuItem>
              <ProtectedLink href="/seller/dashboard/billing" className="w-full">Billing</ProtectedLink>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => logout()}>Log Out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

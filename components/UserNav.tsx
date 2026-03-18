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
import { usePermissions } from "@/components/providers/PermissionProvider";
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
  const { hasPermission } = usePermissions();

  // Role-based checks (simpler and more reliable for navigation)
  const isAdmin = userInfo?.role === "SUPER_ADMIN" || userInfo?.role === "ADMIN";
  const isSeller = userInfo?.role === "SELLER";
  const isMember = userInfo?.role === "MEMBER";

  // Permission-based checks for specific features
  const canManageProducts = hasPermission(PERMISSIONS.MANAGE_PRODUCTS.value);
  const canViewOrders = hasPermission(PERMISSIONS.VIEW_ORDERS.value);
  const canManageOrders = hasPermission(PERMISSIONS.MANAGE_ORDERS.value);

  // Determine dashboard route based on role
  let dashboardRoute: string | null = null;
  if (isAdmin) {
    dashboardRoute = "/admin/dashboard";
  } else if (isSeller) {
    dashboardRoute = "/seller/dashboard";
  } else if (isMember) {
    dashboardRoute = "/member/dashboard";
  }

  // Determine settings route based on role
  let settingsRoute: string | null = null;
  if (isAdmin) {
    settingsRoute = "/admin/dashboard/settings";
  } else if (isSeller) {
    settingsRoute = "/seller/dashboard/settings";
  } else if (isMember) {
    settingsRoute = "/member/dashboard/settings";
  }

  // Menu item hover/focus: light brand purple (not accent/tertiary), no outline ring
  const menuItemClass =
    "focus:bg-brand-primary-50 focus:text-brand-primary-900 data-[highlighted]:bg-brand-primary-50 data-[highlighted]:text-brand-primary-900 focus-visible:outline-none focus-visible:ring-0";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full bg-brand-primary-50 text-brand-primary-800 hover:bg-brand-primary-700 hover:text-white focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={userInfo?.image || undefined} alt="User Image" />
            <AvatarFallback>{userInfo?.username?.[0] || "U"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56 bg-brand-light-neutral-50 border-brand-dark-neutral-200"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-brand-dark-neutral-900">{userInfo?.username || "Guest"}</p>
            <p className="text-xs text-brand-dark-neutral-600">{userInfo?.email || "No email provided"}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-brand-dark-neutral-200" />

        <DropdownMenuGroup>
          {dashboardRoute && (
            <DropdownMenuItem className={menuItemClass}>
              <ProtectedLink href={dashboardRoute} className="w-full">Account</ProtectedLink>
            </DropdownMenuItem>
          )}
          {settingsRoute && (
            <DropdownMenuItem className={menuItemClass}>
              <ProtectedLink href={settingsRoute} className="w-full">Settings</ProtectedLink>
            </DropdownMenuItem>
          )}
          
          {/* Admin-specific menu items */}
          {isAdmin && canManageProducts && (
            <DropdownMenuItem className={menuItemClass}>
              <ProtectedLink href="/admin/dashboard/products" className="w-full">All Products</ProtectedLink>
            </DropdownMenuItem>
          )}
          {isAdmin && canManageOrders && (
            <DropdownMenuItem className={menuItemClass}>
              <ProtectedLink href="/admin/dashboard/orders" className="w-full">All Orders</ProtectedLink>
            </DropdownMenuItem>
          )}
          
          {/* Seller-specific menu items (only show for sellers, not admins) */}
          {isSeller && !isAdmin && canManageProducts && (
            <DropdownMenuItem className={menuItemClass}>
              <ProtectedLink href="/seller/dashboard/products" className="w-full">My Products</ProtectedLink>
            </DropdownMenuItem>
          )}
          {isSeller && !isAdmin && canViewOrders && (
            <DropdownMenuItem className={menuItemClass}>
              <ProtectedLink href="/seller/dashboard/my-orders" className="w-full">My Orders</ProtectedLink>
            </DropdownMenuItem>
          )}
          {isSeller && !isAdmin && (
            <DropdownMenuItem className={menuItemClass}>
              <ProtectedLink href="/seller/dashboard/billing" className="w-full">Billing</ProtectedLink>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-brand-dark-neutral-200" />

        <DropdownMenuItem className={menuItemClass} onClick={() => logout()}>
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import { Separator } from "@/components/ui/separator";
import clsx from "clsx";
import { HomeIcon, Mail, Settings, Package, PackageOpen, CreditCard, Star, FileText, TrendingUp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentPermissions } from "@/hooks/use-current-permissions";

export default function SellerDashboardSideNavbar() {
  const pathname = usePathname();
  const { hasPermission } = useCurrentPermissions();
  const hasBlogPermission = hasPermission('WRITE_BLOG');

  return (
    <div className="lg:block border-r hidden h-full">
      <div className="flex h-full max-h-screen flex-col gap-2 ">
        <div className="flex h-[55px] items-center justify-between border-b px-3 w-full">
          <Link className="flex items-center gap-2 font-semibold ml-1" href="/">
            <span className="">Yarnnu</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2 ">
          <nav className="grid items-start px-4 text-sm font-medium">
            <Link
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                    pathname === "/seller/dashboard",
                }
              )}
              href="/seller/dashboard"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <HomeIcon className="h-3 w-3" />
              </div>
              Dashboard
            </Link>
            <Link
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                    pathname === "/seller/dashboard/billing",
                }
              )}
              href="/seller/dashboard/billing"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <CreditCard className="h-3 w-3" />
              </div>
              Billing
            </Link>
            <Link
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                    pathname === "/seller/dashboard/products",
                }
              )}
              href="/seller/dashboard/products"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <Package className="h-3 w-3" />
              </div>
              Products
            </Link>
            <Link
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                    pathname === "/seller/dashboard/my-orders",
                }
              )}
              href="/seller/dashboard/my-orders"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <Package className="h-3 w-3" />
              </div>
              My Orders
            </Link>
            <Link
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                    pathname === "/seller/dashboard/my-purchases",
                }
              )}
              href="/seller/dashboard/my-purchases"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <PackageOpen className="h-3 w-3" />
              </div>
              My Purchases
            </Link>
            <Link
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                    pathname === "/seller/dashboard/reviews",
                }
              )}
              href="/seller/dashboard/reviews"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <Star className="h-3 w-3" />
              </div>
              Reviews
            </Link>
            <Link
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                    pathname === "/seller/dashboard/sales-promotions",
                }
              )}
              href="/seller/dashboard/sales-promotions"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <TrendingUp className="h-3 w-3" />
              </div>
              Sales & Promotions
            </Link>
            <Link
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                    pathname === "/seller/dashboard/messages",
                }
              )}
              href="/seller/dashboard/messages"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <Mail className="h-3 w-3" />
              </div>
              Messages
            </Link>
            
            {hasBlogPermission && (
              <Link
                className={clsx(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                  {
                    "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                      pathname === "/seller/dashboard/blog",
                  }
                )}
                href="/seller/dashboard/blog"
              >
                <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                  <FileText className="h-3 w-3" />
                </div>
                Blog
              </Link>
            )}
            <Link
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                    pathname.startsWith("/seller/dashboard/custom-orders"),
                }
              )}
              href="/seller/dashboard/custom-orders"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <FileText className="h-3 w-3" />
              </div>
              Custom Orders
            </Link>
            <Separator className="my-3" />
            <Link
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                    pathname === "/seller/dashboard/settings",
                }
              )}
              href="/seller/dashboard/settings"
              id="onboarding"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <Settings className="h-3 w-3" />
              </div>
              Settings
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Separator } from "@/components/ui/separator";
import clsx from "clsx";
import {
  HomeIcon,
  Mail,
  Settings,
  FileQuestion,
  User,
  Package,
  ShoppingCart,
  BarChart3,
  Send,
  MessageSquare,
  FileText,
  Shield,
  TrendingUp,
  Flag,
  HelpCircle,
  Bug,
  AlertCircle,
  Share2,
} from "lucide-react";
import {
  DashboardNavSearchBar,
  useDashboardNavSearchFilter,
} from "@/components/dashboard/dashboard-nav-search";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { useCurrentPermissions } from "@/hooks/use-current-permissions";

export default function AdminDashboardSideNavbar() {
  const pathname = usePathname();
  const { hasPermission } = useCurrentPermissions();
  const hasBlogPermission = hasPermission("WRITE_BLOG");
  const hasHelpPermission = hasPermission("WRITE_HELP_ARTICLES");
  const hasFraudPermission = hasPermission("VIEW_FRAUD_DETECTION");
  const hasAnalyticsPermission = hasPermission("VIEW_ANALYTICS");

  const [navSearchQuery, setNavSearchQuery] = useState("");
  const navRef = useRef<HTMLElement>(null);
  useDashboardNavSearchFilter(navRef, navSearchQuery);

  return (
    <div className="lg:block border-r hidden h-full">
      <div className="flex h-full max-h-screen flex-col gap-2 ">
        <div className="flex h-[55px] items-center justify-between border-b px-3 w-full">
          <Link className="flex items-center gap-2 font-semibold ml-1" href="/">
            <span className="">Yarnnu</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2 ">
          <DashboardNavSearchBar
            value={navSearchQuery}
            onChange={setNavSearchQuery}
          />
          <div className="px-4">
            <Separator className="my-3" />
          </div>
          <nav
            ref={navRef}
            className="grid items-start px-4 text-sm font-medium"
          >
            <Link
              data-nav-label="Dashboard"
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                    pathname === "/admin/dashboard",
                }
              )}
              href="/admin/dashboard"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <HomeIcon className="h-3 w-3" />
              </div>
              Dashboard
            </Link>
            <Link
              data-nav-label="Seller Applications"
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                    pathname === "/admin/dashboard/seller-applications",
                }
              )}
              href="/admin/dashboard/seller-applications"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <FileQuestion className="h-3 w-3" />
              </div>
              Seller Applications
            </Link>
            <Link
              data-nav-label="Users"
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                    pathname === "/admin/dashboard/users",
                }
              )}
              href="/admin/dashboard/users"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <User className="h-3 w-3" />
              </div>
              Users
            </Link>
            <Link
              data-nav-label="All Orders"
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                    pathname === "/admin/dashboard/orders",
                }
              )}
              href="/admin/dashboard/orders"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <ShoppingCart className="h-3 w-3" />
              </div>
              All Orders
            </Link>
            <Link
              data-nav-label="All Products"
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                    pathname === "/admin/dashboard/products",
                }
              )}
              href="/admin/dashboard/products"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <Package className="h-3 w-3" />
              </div>
              All Products
            </Link>
            <Link
              data-nav-label="Social Media Posts"
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                    pathname === "/admin/dashboard/social-media-posts",
                }
              )}
              href="/admin/dashboard/social-media-posts"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <Share2 className="h-3 w-3" />
              </div>
              Social Media Posts
            </Link>
            <Link
              data-nav-label="Messages"
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                    pathname === "/admin/dashboard/messages",
                }
              )}
              href="/admin/dashboard/messages"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <Mail className="h-3 w-3" />
              </div>
              Messages
            </Link>
            <Link
              data-nav-label="Contact Submissions"
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                    pathname === "/admin/dashboard/contact-submissions",
                }
              )}
              href="/admin/dashboard/contact-submissions"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <MessageSquare className="h-3 w-3" />
              </div>
              Contact Submissions
            </Link>
            <Link
              data-nav-label="Reports"
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                    pathname === "/admin/dashboard/reports",
                }
              )}
              href="/admin/dashboard/reports"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <Flag className="h-3 w-3" />
              </div>
              Reports
            </Link>
            <Link
              data-nav-label="Newsletter"
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                    pathname === "/admin/dashboard/newsletter",
                }
              )}
              href="/admin/dashboard/newsletter"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <Send className="h-3 w-3" />
              </div>
              Newsletter
            </Link>
            <Link
              data-nav-label="Onboarding Surveys"
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                    pathname === "/admin/dashboard/onboarding-surveys",
                }
              )}
              href="/admin/dashboard/onboarding-surveys"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <BarChart3 className="h-3 w-3" />
              </div>
              Onboarding Surveys
            </Link>

            {hasFraudPermission && (
              <Link
                data-nav-label="Fraud Detection"
                className={clsx(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                  {
                    "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                      pathname === "/admin/dashboard/fraud-detection",
                  }
                )}
                href="/admin/dashboard/fraud-detection"
              >
                <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                  <Shield className="h-3 w-3" />
                </div>
                Fraud Detection
              </Link>
            )}

            {hasAnalyticsPermission && (
              <Link
                data-nav-label="Analytics"
                className={clsx(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                  {
                    "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                      pathname === "/admin/dashboard/analytics",
                  }
                )}
                href="/admin/dashboard/analytics"
              >
                <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                  <TrendingUp className="h-3 w-3" />
                </div>
                Analytics
              </Link>
            )}

            <Link
              data-nav-label="QA Management"
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                    pathname === "/admin/dashboard/qa",
                }
              )}
              href="/admin/dashboard/qa"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <Bug className="h-3 w-3" />
              </div>
              QA Management
            </Link>

            <Link
              data-nav-label="Error Logs"
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                    pathname === "/admin/dashboard/error-logs",
                }
              )}
              href="/admin/dashboard/error-logs"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <AlertCircle className="h-3 w-3" />
              </div>
              Error Logs
            </Link>

            {hasBlogPermission && (
              <Link
                data-nav-label="Blog"
                className={clsx(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                  {
                    "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                      pathname === "/admin/dashboard/blog",
                  }
                )}
                href="/admin/dashboard/blog"
              >
                <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                  <FileText className="h-3 w-3" />
                </div>
                Blog
              </Link>
            )}

            {hasHelpPermission && (
              <Link
                data-nav-label="Help Center"
                className={clsx(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                  {
                    "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                      pathname === "/admin/dashboard/help-center",
                  }
                )}
                href="/admin/dashboard/help-center"
              >
                <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                  <HelpCircle className="h-3 w-3" />
                </div>
                Help Center
              </Link>
            )}

            <Link
              data-nav-label="Profile"
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                    pathname === "/admin/dashboard/profile",
                }
              )}
              href="/admin/dashboard/profile"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <User className="h-3 w-3" />
              </div>
              Profile
            </Link>

            <Separator className="my-3" data-nav-separator="" />
            <Link
              data-nav-label="Settings"
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-900  transition-all hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 dark:hover:text-purple-100":
                    pathname === "/admin/dashboard/settings",
                }
              )}
              href="/admin/dashboard/settings"
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

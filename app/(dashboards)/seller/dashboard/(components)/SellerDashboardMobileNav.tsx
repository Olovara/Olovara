"use client";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  HomeIcon,
  Mail,
  Settings,
  Package,
  PackageOpen,
  CreditCard,
  Star,
  TrendingUp,
  FileText,
  Share2,
  Heart,
  Bookmark,
  Crown,
  Globe,
  Truck,
  Upload,
  User,
  ChevronRight,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  DashboardNavSearchBar,
  useDashboardNavSearchFilter,
} from "@/components/dashboard/dashboard-nav-search";
import { SELLER_SETTINGS_TAB_SEARCH } from "@/components/dashboard/seller-settings-tab-search";
import { useCurrentPermissions } from "@/hooks/use-current-permissions";
import { useHasFollowedSellers } from "@/hooks/use-has-followed-sellers";
import { useStudioPlanAccess } from "@/hooks/use-studio-plan-access";
import { useRef, useState } from "react";

/** Outline nav buttons: hover uses brand primary, not `--accent` (tertiary). */
const mobileNavButtonClass =
  "w-full justify-start border-brand-dark-neutral-200 hover:border-brand-primary-300 hover:bg-brand-primary-100 hover:text-brand-primary-900 focus-visible:ring-brand-primary-500";

export default function SellerDashboardMobileNav() {
  const { hasPermission } = useCurrentPermissions();
  const hasBlogPermission = hasPermission("WRITE_BLOG");
  const { hasFollowedSellers } = useHasFollowedSellers();
  const { hasWebsiteBuilderAccess } = useStudioPlanAccess();

  const [navSearchQuery, setNavSearchQuery] = useState("");
  const navRef = useRef<HTMLElement>(null);
  useDashboardNavSearchFilter(navRef, navSearchQuery);

  return (
    <Sheet>
      <SheetTrigger
        className="min-[1024px]:hidden rounded-md p-2 transition hover:bg-brand-primary-100 hover:text-brand-primary-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500"
        aria-label="Open menu"
      >
        <HamburgerMenuIcon className="h-5 w-5" />
        <span className="sr-only">Menu</span>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex max-h-[100dvh] flex-col overflow-y-auto overscroll-contain"
      >
        <SheetHeader>
          <Link href="/">
            <SheetTitle>Yarnnu</SheetTitle>
          </Link>
        </SheetHeader>

        <DashboardNavSearchBar
          className="px-0 pt-2"
          inputClassName="border-brand-dark-neutral-200 focus-visible:border-brand-primary-400 focus-visible:ring-brand-primary-500"
          value={navSearchQuery}
          onChange={setNavSearchQuery}
        />
        <div className="px-0">
          <Separator className="my-2" />
        </div>

        <nav
          ref={navRef}
          className="flex flex-col space-y-2 overflow-auto pb-4"
        >
          <SheetClose asChild>
            <Link
              className="block w-full"
              data-nav-label="Dashboard"
              data-nav-search-keywords="home"
              href="/seller/dashboard"
            >
              <Button variant="outline" className={mobileNavButtonClass}>
                <HomeIcon className="mr-2 h-4 w-4 shrink-0" />
                Dashboard
              </Button>
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link className="block w-full" data-nav-label="Billing" href="/seller/dashboard/billing">
              <Button variant="outline" className={mobileNavButtonClass}>
                <CreditCard className="mr-2 h-4 w-4 shrink-0" />
                Billing
              </Button>
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link className="block w-full" data-nav-label="Plans" href="/seller/dashboard/plans">
              <Button variant="outline" className={mobileNavButtonClass}>
                <Crown className="mr-2 h-4 w-4 shrink-0" />
                Plans
              </Button>
            </Link>
          </SheetClose>
          {hasWebsiteBuilderAccess && (
            <SheetClose asChild>
            <Link
              className="block w-full"
              data-nav-label="Website Builder"
              href="/seller/dashboard/website-builder"
            >
                <Button variant="outline" className={mobileNavButtonClass}>
                  <Globe className="mr-2 h-4 w-4 shrink-0" />
                  Website Builder
                </Button>
              </Link>
            </SheetClose>
          )}
          <SheetClose asChild>
            <Link className="block w-full" data-nav-label="Products" href="/seller/dashboard/products">
              <Button variant="outline" className={mobileNavButtonClass}>
                <Package className="mr-2 h-4 w-4 shrink-0" />
                Products
              </Button>
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              className="block w-full"
              data-nav-label="Bulk Import"
              href="/seller/dashboard/bulk-import"
            >
              <Button variant="outline" className={mobileNavButtonClass}>
                <Upload className="mr-2 h-4 w-4 shrink-0" />
                Bulk Import
              </Button>
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link className="block w-full" data-nav-label="Shipping" href="/seller/dashboard/shipping">
              <Button variant="outline" className={mobileNavButtonClass}>
                <Truck className="mr-2 h-4 w-4 shrink-0" />
                Shipping
              </Button>
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              className="block w-full"
              data-nav-label="My Orders"
              href="/seller/dashboard/my-orders"
            >
              <Button variant="outline" className={mobileNavButtonClass}>
                <Package className="mr-2 h-4 w-4 shrink-0" />
                My Orders
              </Button>
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              className="block w-full"
              data-nav-label="My Purchases"
              href="/seller/dashboard/my-purchases"
            >
              <Button variant="outline" className={mobileNavButtonClass}>
                <PackageOpen className="mr-2 h-4 w-4 shrink-0" />
                My Purchases
              </Button>
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link className="block w-full" data-nav-label="Reviews" href="/seller/dashboard/reviews">
              <Button variant="outline" className={mobileNavButtonClass}>
                <Star className="mr-2 h-4 w-4 shrink-0" />
                Reviews
              </Button>
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              className="block w-full"
              data-nav-label="Sales & Promotions"
              data-nav-search-keywords="discount"
              href="/seller/dashboard/sales-promotions"
            >
              <Button variant="outline" className={mobileNavButtonClass}>
                <TrendingUp className="mr-2 h-4 w-4 shrink-0" />
                Sales & Promotions
              </Button>
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link className="block w-full" data-nav-label="Messages" href="/seller/dashboard/messages">
              <Button variant="outline" className={mobileNavButtonClass}>
                <Mail className="mr-2 h-4 w-4 shrink-0" />
                Messages
              </Button>
            </Link>
          </SheetClose>
          {hasFollowedSellers && (
            <SheetClose asChild>
              <Link
                className="block w-full"
                data-nav-label="Followed Sellers"
                href="/seller/dashboard/followed-sellers"
              >
                <Button variant="outline" className={mobileNavButtonClass}>
                  <Heart className="mr-2 h-4 w-4 shrink-0" />
                  Followed Sellers
                </Button>
              </Link>
            </SheetClose>
          )}
          <SheetClose asChild>
            <Link
              className="block w-full"
              data-nav-label="My Wishlists"
              href="/seller/dashboard/wishlists"
            >
              <Button variant="outline" className={mobileNavButtonClass}>
                <Bookmark className="mr-2 h-4 w-4 shrink-0" />
                My Wishlists
              </Button>
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              className="block w-full"
              data-nav-label="Referrals"
              href="/seller/dashboard/referrals"
            >
              <Button variant="outline" className={mobileNavButtonClass}>
                <Share2 className="mr-2 h-4 w-4 shrink-0" />
                Referrals
              </Button>
            </Link>
          </SheetClose>
          {hasBlogPermission && (
            <SheetClose asChild>
              <Link className="block w-full" data-nav-label="Blog" href="/seller/dashboard/blog">
                <Button variant="outline" className={mobileNavButtonClass}>
                  <FileText className="mr-2 h-4 w-4 shrink-0" />
                  Blog
                </Button>
              </Link>
            </SheetClose>
          )}
          <SheetClose asChild>
            <Link className="block w-full" data-nav-label="Profile" href="/seller/dashboard/profile">
              <Button variant="outline" className={mobileNavButtonClass}>
                <User className="mr-2 h-4 w-4 shrink-0" />
                Profile
              </Button>
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              className="block w-full"
              data-nav-label="Custom Orders"
              href="/seller/dashboard/custom-orders"
            >
              <Button variant="outline" className={mobileNavButtonClass}>
                <FileText className="mr-2 h-4 w-4 shrink-0" />
                Custom Orders
              </Button>
            </Link>
          </SheetClose>

          {navSearchQuery.trim() !== "" &&
            SELLER_SETTINGS_TAB_SEARCH.map((tab) => (
              <SheetClose asChild key={tab.id}>
                <Link
                  className="block w-full"
                  data-nav-label={`Settings › ${tab.label}`}
                  data-nav-search-keywords={tab.keywords}
                  href={`/seller/dashboard/settings#${tab.id}`}
                >
                  <Button variant="outline" className={mobileNavButtonClass}>
                    <Settings className="mr-2 h-4 w-4 shrink-0" />
                    <span className="flex min-w-0 items-center gap-1">
                      <span className="truncate">Settings</span>
                      <ChevronRight
                        className="h-3 w-3 shrink-0 opacity-60"
                        aria-hidden
                      />
                      <span className="truncate">{tab.label}</span>
                    </span>
                  </Button>
                </Link>
              </SheetClose>
            ))}

          <Separator className="my-2" data-nav-separator="" />

          <SheetClose asChild>
            <Link className="block w-full" data-nav-label="Settings" href="/seller/dashboard/settings">
              <Button variant="outline" className={mobileNavButtonClass}>
                <Settings className="mr-2 h-4 w-4 shrink-0" />
                Settings
              </Button>
            </Link>
          </SheetClose>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

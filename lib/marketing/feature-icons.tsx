import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Boxes,
  Globe,
  HeartHandshake,
  LayoutDashboard,
  MessageCircle,
  PiggyBank,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Wallet,
} from "lucide-react";

/** Icons paired to feature slugs for hub + detail pages */
export const FEATURE_ICONS: Record<string, LucideIcon> = {
  "verified-handmade-marketplace": BadgeCheck,
  "bulk-import-listings": Boxes,
  "stripe-powered-payouts": Wallet,
  "custom-orders-and-commissions": HeartHandshake,
  "shop-website-builder": Globe,
  "seller-dashboard-insights": LayoutDashboard,
  "fair-pricing-aligned-growth": PiggyBank,
  "curated-handmade-discovery": Sparkles,
  "secure-checkout-trust": ShieldCheck,
  "direct-messages-with-makers": MessageCircle,
  "wishlists-and-planning": ShoppingBag,
  "shop-pages-and-stories": Store,
  "reviews-and-community-trust": Star,
};

export function getFeatureIcon(slug: string): LucideIcon {
  return FEATURE_ICONS[slug] ?? Sparkles;
}

import { SellerAnalyticsContent } from "./SellerAnalyticsContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics | Seller Dashboard | OLOVARA",
  description:
    "Track product views, shop views, orders, revenue, average order value, conversion rate, and top products.",
  robots: { index: false, follow: false },
};

export default function SellerAnalyticsPage() {
  return <SellerAnalyticsContent />;
}

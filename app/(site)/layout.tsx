import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { Navbar } from "@/components/Navbar";
import { cn } from "@/lib/utils";
import Footer from "@/components/Footer";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Handmade Marketplace | Unique Artisan Products & Crafts",
  description: "Discover unique handmade products from talented artisans worldwide. Shop crochet patterns, handmade jewelry, home decor, accessories, and more. Support independent creators and find one-of-a-kind treasures.",
  keywords: [
    "handmade marketplace",
    "artisan products",
    "crochet patterns",
    "handmade jewelry", 
    "unique gifts",
    "handmade home decor",
    "artisan marketplace",
    "handmade crafts",
    "support small business",
    "handmade accessories",
    "handcrafted goods",
    "artisan crafts",
    "unique handmade items"
  ],
  openGraph: {
    title: "Handmade Marketplace | Unique Artisan Products & Crafts",
    description: "Discover unique handmade products from talented artisans worldwide. Shop crochet patterns, handmade jewelry, home decor, accessories, and more.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Handmade Marketplace | Unique Artisan Products & Crafts",
    description: "Discover unique handmade products from talented artisans worldwide.",
  },
};

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative flex flex-col min-h-screen", inter.className)}>
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
      <Toaster position="top-center" richColors />
    </div>
  );
}

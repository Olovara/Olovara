import { ProductRow } from "@/components/ProductRow";
import { ShopByValues } from "@/components/ShopByValues";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { WebsiteStructuredData } from "@/components/WebsiteStructuredData";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yarnnu - Handmade Marketplace | Unique Artisan Products",
  description: "Discover unique handmade products from talented artisans around the world. Shop crochet patterns, handmade jewelry, home decor, accessories, and more. Support independent creators and find one-of-a-kind treasures.",
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
    "handmade accessories"
  ],
  openGraph: {
    title: "Yarnnu - Handmade Marketplace | Unique Artisan Products",
    description: "Discover unique handmade products from talented artisans around the world. Shop crochet patterns, handmade jewelry, home decor, accessories, and more.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yarnnu - Handmade Marketplace | Unique Artisan Products",
    description: "Discover unique handmade products from talented artisans around the world.",
  },
  alternates: {
    canonical: "https://yarnnu.com/",
  },
};

export default function Home() {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 mb-24">
      <div className="py-20 mx-auto text-center flex flex-col items-center max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Your marketplace for high-quality{" "}
          <span className="text-purple-600">handcrafted goods</span>.
        </h1>
        <p className="mt-6 text-lg max-w-prose text-muted-foreground">
          Welcome to Yarnnu. Every shop on our platform is verified by our team
          to ensure the highest quality standards.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <Link href="/products" className={buttonVariants()}>
            Shop Now
          </Link>
        </div>
      </div>
      <ProductRow category="newest" />
      <ProductRow category="random" />
      <ShopByValues />
      
      {/* Add structured data for SEO */}
      <WebsiteStructuredData pageType="home" />
    </section>
  );
}
import { ProductRow } from "@/components/ProductRow";
import { ShopByValues } from "@/components/ShopByValues";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { WebsiteStructuredData } from "@/components/WebsiteStructuredData";
import { BadgeCheck, ShieldCheck, Sparkles } from "lucide-react";

import { Metadata } from "next";

// Force dynamic rendering - this page uses getUserCountryCode() which uses headers()
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "OLOVARA - Handmade Marketplace | Unique Artisan Products",
  description:
    "Discover unique handmade products from talented artisans around the world. Shop crochet patterns, handmade jewelry, home decor, accessories, and more. Support independent creators and find one-of-a-kind treasures.",
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
  ],
  openGraph: {
    title: "OLOVARA - Handmade Marketplace | Unique Artisan Products",
    description:
      "Discover unique handmade products from talented artisans around the world. Shop crochet patterns, handmade jewelry, home decor, accessories, and more.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OLOVARA - Handmade Marketplace | Unique Artisan Products",
    description:
      "Discover unique handmade products from talented artisans around the world.",
  },
  alternates: {
    canonical: "https://olovara.com/",
  },
};

export default function Home() {
  return (
    <>
      <section className="mx-auto mb-24 max-w-7xl px-4 md:px-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center py-20 text-center">
          <h1
            className="text-4xl font-bold tracking-tight text-brand-dark-neutral-900 sm:text-6xl"
            style={{ fontFamily: "Noto Serif Display, ui-serif, serif" }}
          >
            Your marketplace for high-quality{" "}
            <span className="text-brand-primary-700">handcrafted goods</span>.
          </h1>
          <p className="mt-6 max-w-prose text-lg text-brand-dark-neutral-600">
            Welcome to OLOVARA. Every shop on our platform is verified by our
            team to ensure the highest quality standards.
          </p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <Link href="/products" className={buttonVariants()}>
              SHOP NOW
            </Link>
          </div>
        </div>
        <ProductRow category="followed" />
        <ProductRow category="newest" />
        <ProductRow category="random" />
      </section>

      <div className="mt-16 min-w-0">
        <ShopByValues />
      </div>

      <section className="mx-auto mb-24 mt-16 max-w-7xl px-4 md:px-8">
        {/* Mini landing section */}
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-brand-dark-neutral-900">
            Why OLOVARA
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-brand-dark-neutral-600">
            Calm, curated shopping built for handmade.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-brand-dark-neutral-200 bg-brand-light-neutral-50 p-6">
            <div className="h-11 w-11 rounded-full bg-brand-primary-50 flex items-center justify-center mb-4">
              <BadgeCheck className="h-5 w-5 text-brand-primary-700" />
            </div>
            <h3 className="text-lg font-semibold text-brand-dark-neutral-900">
              Verified makers
            </h3>
            <p className="mt-2 text-sm text-brand-dark-neutral-600">
              Every shop is reviewed so you can trust the work behind the
              product.
            </p>
          </div>

          <div className="rounded-xl border border-brand-dark-neutral-200 bg-brand-light-neutral-50 p-6">
            <div className="h-11 w-11 rounded-full bg-brand-primary-50 flex items-center justify-center mb-4">
              <Sparkles className="h-5 w-5 text-brand-primary-700" />
            </div>
            <h3 className="text-lg font-semibold text-brand-dark-neutral-900">
              Uncluttered experience
            </h3>
            <p className="mt-2 text-sm text-brand-dark-neutral-600">
              Designed to feel like a gallery: clear hierarchy, space, and focus
              on imagery.
            </p>
          </div>

          <div className="rounded-xl border border-brand-dark-neutral-200 bg-brand-light-neutral-50 p-6">
            <div className="h-11 w-11 rounded-full bg-brand-primary-50 flex items-center justify-center mb-4">
              <ShieldCheck className="h-5 w-5 text-brand-primary-700" />
            </div>
            <h3 className="text-lg font-semibold text-brand-dark-neutral-900">
              Secure checkout & support
            </h3>
            <p className="mt-2 text-sm text-brand-dark-neutral-600">
              Safe payments, clear policies, and a platform built to protect
              buyers and sellers.
            </p>
          </div>
        </div>

        <WebsiteStructuredData pageType="home" />
      </section>
    </>
  );
}

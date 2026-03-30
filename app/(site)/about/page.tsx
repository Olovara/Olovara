import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Heart,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
  Store,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "Our Story | Yarnnu - Where Human Creativity Finds a Home",
  description:
    "Yarnnu was built to protect the soul of handmade. Discover why we're building a marketplace that puts people above algorithms and artisans above investors.",
};

export default function AboutUs() {
  return (
    <div className="min-h-screen w-full bg-brand-light-neutral-50">
      {/* 1. HERO: The Shared Dream (The Guide meets the Hero) */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-brand-primary-50/60 via-brand-light-neutral-50 to-brand-secondary-50/50 border-b border-brand-light-neutral-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <Badge
              variant="outline"
              className="mb-6 px-4 py-1 text-sm font-medium border-brand-primary-300 text-brand-primary-800 bg-white"
            >
              The Yarnnu Mission
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-brand-dark-neutral-900 mb-6 leading-tight">
              Where{" "}
              <span className="text-brand-primary-700 underline decoration-brand-secondary-300">
                Human Creativity
              </span>{" "}
              <br className="hidden md:block" />
              Finds a Home.
            </h1>

            <p className="text-xl md:text-2xl text-brand-dark-neutral-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              In a world of mass-production and AI-generated noise, we built a
              sanctuary for things made by hand and the people who love them.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/seller-application"
                className={buttonVariants({
                  size: "lg",
                  className: "bg-brand-primary-700 hover:bg-brand-primary-800",
                })}
              >
                Open Your Shop
              </Link>
              <Link
                href="/products"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "border-brand-primary-700 text-brand-primary-700 hover:bg-brand-primary-700 hover:text-brand-light-neutral-50 hover:border-brand-primary-700"
                )}
              >
                Explore the Market
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM: The "Villain" (Why we exist) */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-brand-dark-neutral-900 mb-6">
                Marketplaces lost their way. <br />
                <span className="text-brand-primary-600">
                  We&apos;re finding it again.
                </span>
              </h2>
              <p className="text-lg text-brand-dark-neutral-600 mb-6">
                For years, handmade was about connection. You knew who made your
                sweater; you knew the story behind your ceramic mug.
              </p>
              <p className="text-lg text-brand-dark-neutral-600">
                Then came the &quot;growth at all costs&quot; era. Hidden fees,
                mass-produced knockoffs, and AI-generated junk flooded the
                market. Artisans felt abandoned, and buyers felt misled.{" "}
                <strong>
                  That&apos;s the problem we&apos;re here to solve.
                </strong>
              </p>
            </div>
            <div className="bg-brand-light-neutral-100 p-8 rounded-3xl border border-brand-light-neutral-200">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-brand-light-neutral-50 rounded-full flex items-center justify-center text-brand-error-600 font-bold">
                    ✕
                  </div>
                  <p className="text-brand-dark-neutral-700">
                    <strong>No Dropshipping:</strong> If it&apos;s not handmade
                    by you, it&apos;s not on Yarnnu.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-brand-light-neutral-50 rounded-full flex items-center justify-center text-brand-error-600 font-bold">
                    ✕
                  </div>
                  <p className="text-brand-dark-neutral-700">
                    <strong>No AI-Generated Art:</strong> We celebrate human
                    hands, not prompts.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-brand-light-neutral-50 rounded-full flex items-center justify-center text-brand-error-600 font-bold">
                    ✕
                  </div>
                  <p className="text-brand-dark-neutral-700">
                    <strong>No Investor Greed:</strong> We&apos;re bootstrapped.
                    We answer to you, not shareholders.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE PLAN: Value for Both Heroes */}
      <section className="py-20 bg-brand-light-neutral-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-dark-neutral-900 mb-4">
              A Marketplace Built for Both Sides
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For Sellers */}
            <div className="bg-white p-8 rounded-2xl border border-brand-light-neutral-200 shadow-sm">
              <div className="w-12 h-12 bg-brand-primary-100 rounded-xl flex items-center justify-center mb-6">
                <Store className="w-6 h-6 text-brand-primary-700" />
              </div>
              <h3 className="text-2xl font-bold text-brand-dark-neutral-900 mb-4">
                For the Artisans
              </h3>
              <p className="text-brand-dark-neutral-600 mb-6">
                You spend hours pouring your heart into your craft. You deserve
                a platform that treats your work with dignity not as
                &quot;inventory&quot; to be exploited for fees.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-brand-dark-neutral-700">
                  <ShieldCheck className="w-5 h-5 mr-3 text-brand-primary-600" />{" "}
                  Human-verified shop reviews
                </li>
                <li className="flex items-center text-brand-dark-neutral-700">
                  <ShieldCheck className="w-5 h-5 mr-3 text-brand-primary-600" />{" "}
                  Transparent 10% commission
                </li>
                <li className="flex items-center text-brand-dark-neutral-700">
                  <ShieldCheck className="w-5 h-5 mr-3 text-brand-primary-600" />{" "}
                  No listing or monthly fees
                </li>
              </ul>
              <Link
                href="/sell"
                className="inline-flex items-center text-brand-primary-700 font-semibold hover:gap-2 transition-all"
              >
                Start selling with us <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>

            {/* For Buyers */}
            <div className="bg-white p-8 rounded-2xl border border-brand-light-neutral-200 shadow-sm">
              <div className="w-12 h-12 bg-brand-secondary-100 rounded-xl flex items-center justify-center mb-6">
                <ShoppingBag className="w-6 h-6 text-brand-secondary-700" />
              </div>
              <h3 className="text-2xl font-bold text-brand-dark-neutral-900 mb-4">
                For the Collectors
              </h3>
              <p className="text-brand-dark-neutral-600 mb-6">
                You&apos;re tired of generic gifts that end up in landfills. You
                want items with soul, created by real people with real stories.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-brand-dark-neutral-700">
                  <Sparkles className="w-5 h-5 mr-3 text-brand-secondary-600" />{" "}
                  Guaranteed authentic handmade
                </li>
                <li className="flex items-center text-brand-dark-neutral-700">
                  <Sparkles className="w-5 h-5 mr-3 text-brand-secondary-600" />{" "}
                  Direct connection with the maker
                </li>
                <li className="flex items-center text-brand-dark-neutral-700">
                  <Sparkles className="w-5 h-5 mr-3 text-brand-secondary-600" />{" "}
                  Support small, independent businesses
                </li>
              </ul>
              <Link
                href="/products"
                className="inline-flex items-center text-brand-secondary-700 font-semibold hover:gap-2 transition-all"
              >
                Browse authentic goods <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE FOUNDER: Empathy & Authority */}
      <section className="py-24 bg-white border-y border-brand-light-neutral-200">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="w-48 h-48 bg-gradient-to-br from-brand-primary-200 to-brand-secondary-200 rounded-full flex-shrink-0 flex items-center justify-center shadow-inner">
              <Heart className="w-20 h-20 text-brand-primary-600 animate-pulse" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-brand-dark-neutral-900 mb-6">
                The &quot;Why&quot; Behind the Code
              </h2>
              <p className="text-lg text-brand-dark-neutral-700 mb-4">
                &quot;I watched my wife spend days crocheting intricate,
                beautiful pieces, only to see her struggle against platforms
                that prioritized mass-manufactured items and algorithms over her
                artistry.&quot;
              </p>
              <p className="text-lg text-brand-dark-neutral-700 mb-6">
                I built Yarnnu because I believe the world needs more things
                made with love and fewer things made by machines. We aren&apos;t
                here to be the biggest marketplace just the most authentic one.
              </p>
              <p className="font-bold text-brand-dark-neutral-900">
                — Simeon, Founder of Yarnnu
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION: The Happy Ending */}
      <section className="py-20 bg-brand-primary-900 text-brand-light-neutral-50 overflow-hidden relative">
        <div className="max-w-4xl mx-auto text-center px-4 md:px-8 relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Join the Movement
          </h2>
          <p className="text-xl mb-10 text-brand-light-neutral-200">
            Whether you&apos;re a maker or a seeker of beautiful things,
            there&apos;s a place for you here. Let&apos;s keep the soul of
            handmade alive, together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/seller-application"
              className={buttonVariants({
                size: "lg",
                className:
                  "bg-brand-secondary-500 hover:bg-brand-secondary-600 text-white border-0",
              })}
            >
              Open Your Shop
            </Link>
            <Link
              href="/products"
              className={buttonVariants({
                size: "lg",
                variant: "outline",
                className:
                  "bg-transparent text-white border-white hover:bg-white hover:text-brand-primary-900",
              })}
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

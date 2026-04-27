import { buttonVariants } from "@/components/ui/button";
import type { MarketingFeature } from "@/lib/marketing/features-data";
import { BUYER_FEATURES, SELLER_FEATURES } from "@/lib/marketing/features-data";
import { getFeatureIcon } from "@/lib/marketing/feature-icons";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Marketplace Features for Sellers & Buyers | OLOVARA",
  description:
    "Explore OLOVARA features for artisans and shoppers: verified handmade selling, Stripe payouts, custom orders, shop sites, secure checkout, wishlists, and more.",
  keywords: [
    "handmade marketplace features",
    "sell handmade online",
    "artisan marketplace",
    "secure checkout handmade",
    "custom orders makers",
  ],
  openGraph: {
    title: "OLOVARA Features — Built for Makers & Buyers",
    description:
      "Tools and trust signals for independent sellers and anyone who shops handmade.",
    type: "website",
  },
};

function FeatureGrid({
  features,
  accentClass,
  cardClass,
}: {
  features: MarketingFeature[];
  accentClass: string;
  cardClass: string;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((f) => {
        const Icon = getFeatureIcon(f.slug);
        return (
          <article
            key={f.slug}
            className={cn(
              "flex flex-col rounded-2xl border border-brand-light-neutral-200 p-6 shadow-sm transition-shadow hover:shadow-md",
              cardClass,
            )}
          >
            <div
              className={cn(
                "mb-4 flex h-12 w-12 items-center justify-center rounded-xl border",
                accentClass,
              )}
            >
              <Icon className="h-6 w-6" aria-hidden />
            </div>
            <h3 className="text-lg font-semibold text-brand-dark-neutral-900">
              {f.title}
            </h3>
            <p className="mt-2 flex-grow text-sm leading-relaxed text-brand-dark-neutral-600">
              {f.summary}
            </p>
            <Link
              href={`/features/${f.slug}`}
              className={cn(
                buttonVariants({ variant: "link" }),
                "mt-4 h-auto justify-start p-0 text-brand-primary-700 hover:text-brand-primary-800",
              )}
            >
              Learn more →
            </Link>
          </article>
        );
      })}
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen w-full bg-brand-light-neutral-50">
      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-brand-primary-50/70 via-brand-light-neutral-50 to-brand-secondary-50/40">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary-700">
              OLOVARA features
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-brand-dark-neutral-900 md:text-5xl">
              Everything you need to{" "}
              <span className="text-brand-primary-700">sell & shop handmade</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-brand-dark-neutral-600 md:text-xl">
              Whether you run a studio or you are looking for something made with
              care, OLOVARA connects real makers with buyers who value craft using
              tools and standards designed for that relationship.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/seller-application"
                className={buttonVariants({
                  size: "lg",
                  className:
                    "w-full bg-brand-primary-700 text-brand-light-neutral-50 hover:bg-brand-primary-800 sm:w-auto",
                })}
              >
                Apply to sell
              </Link>
              <Link
                href="/products"
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className:
                    "w-full border-brand-primary-700 text-brand-primary-700 hover:bg-brand-primary-700 hover:text-brand-light-neutral-50 sm:w-auto",
                })}
              >
                Browse handmade
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sellers */}
      <section
        id="seller-benefits"
        className="border-y border-brand-light-neutral-200 bg-brand-light-neutral-100 py-16 md:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
            <h2 className="text-3xl font-bold text-brand-dark-neutral-900 md:text-4xl">
              For sellers
            </h2>
            <p className="mt-4 text-lg text-brand-dark-neutral-600">
              Grow a handmade business with payouts, custom orders, and a shop
              experience that reflects your brand.
            </p>
          </div>
          <FeatureGrid
            features={SELLER_FEATURES}
            accentClass="border-brand-primary-100 bg-brand-primary-50 text-brand-primary-700"
            cardClass="bg-brand-light-neutral-50"
          />
          <div className="mt-10 flex justify-center">
            <Link
              href="/sell"
              className={buttonVariants({
                variant: "outline",
                className:
                  "border-brand-primary-700 text-brand-primary-700 hover:bg-brand-primary-700 hover:text-brand-light-neutral-50",
              })}
            >
              Learn more about selling on OLOVARA
            </Link>
          </div>
        </div>
      </section>

      {/* Buyers */}
      <section
        id="buyer-benefits"
        className="bg-brand-light-neutral-50 py-16 md:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
            <h2 className="text-3xl font-bold text-brand-dark-neutral-900 md:text-4xl">
              For buyers
            </h2>
            <p className="mt-4 text-lg text-brand-dark-neutral-600">
              Discover makers, buy with confidence, and keep track of pieces you
              love.
            </p>
          </div>
          <FeatureGrid
            features={BUYER_FEATURES}
            accentClass="border-brand-secondary-100 bg-brand-secondary-50 text-brand-secondary-700"
            cardClass="bg-brand-light-neutral-100"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-brand-primary-700 py-16 md:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgb(var(--brand-secondary-400) / 0.35), transparent 45%), radial-gradient(circle at 80% 30%, rgb(var(--brand-tertiary-400) / 0.25), transparent 40%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-4 text-center md:px-8">
          <h2 className="text-3xl font-bold text-brand-light-neutral-50 md:text-4xl">
            Ready to join OLOVARA?
          </h2>
          <p className="mt-4 text-lg text-brand-primary-100">
            Open a shop and reach buyers who choose handmade or start exploring
            independent makers today.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/seller-application"
              className={buttonVariants({
                size: "lg",
                className:
                  "w-full bg-brand-primary-500 text-brand-light-neutral-50 hover:bg-brand-primary-800 sm:w-auto",
              })}
            >
              Start selling
            </Link>
            <Link
              href="/register"
              className={buttonVariants({
                size: "lg",
                variant: "outline",
                className:
                  "w-full border-brand-light-neutral-100 bg-transparent text-brand-light-neutral-50 hover:bg-brand-primary-800/30 hover:text-brand-light-neutral-50 sm:w-auto",
              })}
            >
              Create buyer account
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getAllFeatureSlugs,
  getFeatureBySlug,
} from "@/lib/marketing/features-data";
import { getFeatureIcon } from "@/lib/marketing/feature-icons";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

type Props = { params: { slug: string } };

export async function generateStaticParams() {
  return getAllFeatureSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const feature = getFeatureBySlug(params.slug);
  if (!feature) {
    return { title: "Features | OLOVARA" };
  }
  return {
    title: feature.metaTitle,
    description: feature.metaDescription,
    openGraph: {
      title: feature.metaTitle,
      description: feature.metaDescription,
      type: "article",
    },
  };
}

export default async function FeatureDetailPage({ params }: Props) {
  const feature = getFeatureBySlug(params.slug);
  if (!feature) notFound();

  const Icon = getFeatureIcon(feature.slug);
  const isSeller = feature.audience === "seller";

  return (
    <div className="min-h-screen w-full bg-brand-light-neutral-50">
      <article>
        {/* Hero */}
        <header className="relative overflow-hidden border-b border-brand-light-neutral-200 bg-gradient-to-br from-brand-primary-50/60 via-white to-brand-secondary-50/30">
          <div className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-16">
            <nav aria-label="Breadcrumb" className="mb-8">
              <ol className="flex flex-wrap items-center gap-2 text-sm text-brand-dark-neutral-600">
                <li>
                  <Link
                    href="/"
                    className="hover:text-brand-primary-700 hover:underline"
                  >
                    Home
                  </Link>
                </li>
                <ChevronRight className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
                <li>
                  <Link
                    href="/features"
                    className="hover:text-brand-primary-700 hover:underline"
                  >
                    Features
                  </Link>
                </li>
                <ChevronRight className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
                <li className="font-medium text-brand-dark-neutral-900">
                  {feature.title}
                </li>
              </ol>
            </nav>

            <Badge
              className={cn(
                "mb-4 border px-3 py-1 font-medium",
                isSeller
                  ? "border-brand-primary-200 bg-brand-primary-50 text-brand-primary-800"
                  : "border-brand-secondary-200 bg-brand-secondary-50 text-brand-secondary-800",
              )}
            >
              {isSeller ? "For sellers" : "For buyers"}
            </Badge>

            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <div
                className={cn(
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border shadow-sm",
                  isSeller
                    ? "border-brand-primary-100 bg-brand-primary-50 text-brand-primary-700"
                    : "border-brand-secondary-100 bg-brand-secondary-50 text-brand-secondary-700",
                )}
              >
                <Icon className="h-7 w-7" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-bold tracking-tight text-brand-dark-neutral-900 md:text-4xl">
                  {feature.title}
                </h1>
                <p className="mt-4 text-lg leading-relaxed text-brand-dark-neutral-600">
                  {feature.summary}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-16">
          <p className="text-lg leading-relaxed text-brand-dark-neutral-700">
            {feature.detailIntro}
          </p>

          <div className="mt-12 space-y-12">
            {feature.detailSections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-xl font-semibold text-brand-dark-neutral-900 md:text-2xl">
                  {section.heading}
                </h2>
                <div className="mt-4 space-y-4">
                  {section.body.map((paragraph, i) => (
                    <p
                      key={i}
                      className="leading-relaxed text-brand-dark-neutral-600"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-16 flex flex-col gap-3 border-t border-brand-light-neutral-200 pt-10 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/features"
              className={buttonVariants({
                variant: "outline",
                className:
                  "border-brand-primary-700 text-brand-primary-700 hover:bg-brand-primary-700 hover:text-brand-light-neutral-50",
              })}
            >
              ← All features
            </Link>
            <Link
              href={isSeller ? "/seller-application" : "/register"}
              className={buttonVariants({
                className:
                  "bg-brand-primary-700 text-brand-light-neutral-50 hover:bg-brand-primary-800",
              })}
            >
              {isSeller ? "Apply to sell" : "Create account"}
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}

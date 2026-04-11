import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, Search, HelpCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

interface HelpCenterPageProps {
  searchParams: {
    category?: string;
    search?: string;
  };
}

export async function generateMetadata({
  searchParams,
}: HelpCenterPageProps): Promise<Metadata> {
  const category = searchParams.category;
  const search = searchParams.search;

  // Build canonical URL
  const canonicalParams = new URLSearchParams();
  if (category) canonicalParams.set("category", category);
  if (search) canonicalParams.set("search", search);

  const canonicalUrl = canonicalParams.toString()
    ? `/help-center?${canonicalParams.toString()}`
    : "/help-center";

  // Generate dynamic title and description based on filters
  let title = "Help Center | OLOVARA - Get Support for Our Handmade Marketplace";
  let description =
    "Get help with selling on OLOVARA. Find guides, tutorials, and support for sellers. Learn how to set up your shop, manage products, handle shipping, and grow your handmade business.";

  if (search) {
    title = `Help Search: "${search}" | OLOVARA Help Center`;
    description = `Search results for "${search}" in our help center. Find answers to your questions about selling on OLOVARA.`;
  } else if (category) {
    const categoryLabel =
      category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, " ");
    title = `${categoryLabel} Help | OLOVARA Help Center`;
    description = `Browse ${categoryLabel.toLowerCase()} help articles and guides for OLOVARA sellers. Get expert advice and support.`;
  }

  return {
    title,
    description,
    keywords: [
      "OLOVARA help",
      "seller support",
      "handmade marketplace help",
      "artisan business support",
      "shop setup guide",
      "selling tips",
      "marketplace tutorials",
      "seller resources",
      "handmade business help",
      "artisan platform support",
      ...(category ? [`${category} help`, `${category} guide`] : []),
      ...(search ? [`${search} help`, `${search} support`] : []),
    ],
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalUrl,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function HelpCenterPage({
  searchParams,
}: HelpCenterPageProps) {
  // Fetch help articles
  const helpArticles = await db.helpArticle.findMany({
    where: {
      status: "PUBLISHED",
      isPrivate: false,
      ...(searchParams.category && {
        catSlug: searchParams.category,
      }),
      ...(searchParams.search && {
        OR: [
          { title: { contains: searchParams.search, mode: "insensitive" } },
          {
            description: { contains: searchParams.search, mode: "insensitive" },
          },
        ],
      }),
    },
    include: {
      cat: true,
    },
    orderBy: [
      { order: "asc" },
      { publishedAt: "desc" },
    ],
  });

  // Fetch categories for help articles
  const categories = await db.helpCategory.findMany({
    where: {
      isActive: true,
      articles: {
        some: {
          status: "PUBLISHED",
          isPrivate: false,
        },
      },
    },
    orderBy: {
      order: "asc",
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
              <HelpCircle className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Help Center</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to your questions and learn how to make the most of
            OLOVARA.
          </p>
        </div>

        {/* Search and Categories */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/help-center?category=${category.slug}`}
              >
                <Badge
                  variant={
                    searchParams.category === category.slug
                      ? "default"
                      : "outline"
                  }
                  className="cursor-pointer hover:bg-purple-50"
                >
                  {category.title}
                </Badge>
              </Link>
            ))}
          </div>

          <div className="flex gap-2">
            <Link href="/help-center/shipping-options">
              <Button variant="outline" size="sm">
                <BookOpen className="h-4 w-4 mr-2" />
                Shipping Guide
              </Button>
            </Link>
            <Link href="/help-center/shop-setup">
              <Button variant="outline" size="sm">
                <BookOpen className="h-4 w-4 mr-2" />
                Shop Setup
              </Button>
            </Link>
          </div>
        </div>

        {/* Help Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {helpArticles.map((article) => (
            <Card
              key={article.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {article.cat.title}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {article.views} views
                  </span>
                </div>
                <CardTitle className="text-lg">{article.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {article.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/help-center/${article.slug}`}>
                  <Button variant="ghost" size="sm" className="w-full">
                    Read Article
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {helpArticles.length === 0 && (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              No help articles found
            </h3>
            <p className="text-gray-600">
              {searchParams.search || searchParams.category
                ? "Try adjusting your search or browse all categories."
                : "Help articles will appear here once they're published."}
            </p>
          </div>
        )}

        {/* Featured Help Content */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-8 text-white">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold">Need More Help?</h2>
            <p className="text-purple-100 max-w-2xl mx-auto">
              Can&apos;t find what you&apos;re looking for? Our support team is
              here to help you succeed.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/contact">
                <Button variant="secondary" size="lg">
                  Contact Support
                </Button>
              </Link>
              <Link href="/seller-application">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-white border-white hover:bg-white hover:text-purple-600"
                >
                  Become a Seller
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

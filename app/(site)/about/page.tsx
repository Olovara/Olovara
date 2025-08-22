import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Heart,
  Star,
  Users,
  Zap,
  Globe,
  Award,
  DollarSign,
  CheckCircle,
} from "lucide-react";

export const metadata = {
  title: "About Yarnnu - Built by Artisans, for Artisans",
  description:
    "Learn about Yarnnu's story - from a husband wanting to help his wife sell her crochet creations to a marketplace built for handmade creators. Join our founding seller program.",
};

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <Badge
              variant="secondary"
              className="mb-6 px-4 py-2 text-sm font-medium bg-purple-100 text-purple-800 border-purple-200"
            >
              <Heart className="w-4 h-4 mr-2" />
              Our Story
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
              Built by <span className="text-purple-600">Artisans</span>, for{" "}
              <span className="text-purple-600">Artisans</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Yarnnu was created for one reason: to put handmade sellers back in
              control. No investors. No drop shippers. No endless fees. Just a
              marketplace built for real artisans.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              The Story Behind Yarnnu
            </h2>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                How It All Started
              </h3>
              <p className="text-gray-700 mb-4">
                When we looked at existing marketplaces, we saw fees, resellers,
                and platforms that had lost touch with handmade. Yarnnu was
                built to change that a seller-focused, transparent marketplace
                where authenticity always comes first.
              </p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Our Vision
              </h3>
              <p className="text-gray-700 mb-4">
                We&apos;re not just building a marketplace. We&apos;re building
                a home for handmade complete with the tools, community, and
                transparency sellers deserve. Our vision is simple: help
                artisans grow their craft into a thriving business without
                distractions, hidden fees, or middlemen.
              </p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Why We&apos;re Different
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Seller-first, not investor-driven</strong> -
                    We&apos;re bootstrapped, so we answer to sellers, not
                    shareholders
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Handmade only</strong> - No resellers, no AI, just
                    real products by real artisans
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Simple, transparent commission</strong> - No listing
                    fees, no subscriptions, just a fair percentage when you sell
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Tools and education to help you succeed</strong> -
                    Everything you need to grow your handmade business
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Founding Seller Program */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 md:px-8">
          <Badge
            variant="secondary"
            className="mb-6 px-4 py-2 text-sm font-medium bg-white/20 text-white border-white/30"
          >
            <Award className="w-4 h-4 mr-2" />
            Limited Time Opportunity
          </Badge>

          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Join Our First 50 Founding Sellers
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Be part of something special from the beginning. Get exclusive
            benefits and help shape a marketplace built for artisans, by
            artisans.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <CheckCircle className="w-8 h-8 mx-auto mb-3 text-purple-300" />
              <h3 className="font-semibold mb-2">Lifetime 8% Commission</h3>
              <p className="text-sm opacity-80">
                Lock in 2% savings forever (vs 10% for regular sellers)
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <Users className="w-8 h-8 mx-auto mb-3 text-purple-300" />
              <h3 className="font-semibold mb-2">Priority Placement</h3>
              <p className="text-sm opacity-80">
                Featured in search results and categories for 1 year
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <Award className="w-8 h-8 mx-auto mb-3 text-purple-300" />
              <h3 className="font-semibold mb-2">Showcase Opportunities</h3>
              <p className="text-sm opacity-80">
                Featured in blogs, emails, and social media marketing
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sell"
              className={buttonVariants({
                size: "lg",
                className:
                  "text-lg px-8 py-4 bg-white text-purple-600 hover:bg-gray-100",
              })}
            >
              Learn More About Founding Sellers
            </Link>
            <Link
              href="/seller-application"
              className={buttonVariants({
                size: "lg",
                className:
                  "text-lg px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white hover:text-purple-600",
              })}
            >
              Apply Now
            </Link>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What We Stand For
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These core values guide everything we do at Yarnnu
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Authenticity</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Every product on Yarnnu is truly handmade by real people. No
                  drop shippers, no AI-generated content, no factory-made goods.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Transparency</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Simple, honest pricing. No hidden fees, no surprise charges.
                  We only make money when you do.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Community</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Built without investors, so we listen to sellers, not
                  shareholders. Your feedback shapes our future.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Every seller is verified by our team. We maintain high
                  standards so customers trust and return to our marketplace.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Innovation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Powerful tools designed specifically for handmade sellers.
                  Focus on your craft, not administrative tasks.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Global Reach</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Connect with customers worldwide. International shipping and
                  multi-currency support to grow your business globally.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Meet the Founder */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet the Founder
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Hi, I&apos;m Simeon
                </h3>
                <p className="text-gray-700 mb-4">
                  I started Yarnnu after seeing how hard it was for my wife to
                  sell her crochet creations online. Marketplaces had lost their
                  way. Too many fees, too much noise, not enough support for
                  real makers. Yarnnu is my answer to that problem: a platform
                  built for artisans, not investors.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/sell"
                    className={buttonVariants({
                      className: "bg-purple-600 hover:bg-purple-700",
                    })}
                  >
                    Join as a Founding Seller
                  </Link>
                  <Link
                    href="/contact"
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Get in Touch
                  </Link>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl p-8 text-center">
                <div className="w-24 h-24 bg-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-12 h-12 text-purple-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Built with Love
                </h4>
                <p className="text-gray-600 text-sm">
                  Created to help my wife share her crochet creations, now
                  helping artisans worldwide share their passion.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto text-center px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Ready to Be Part of Something Special?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join Yarnnu today and be part of a marketplace that truly
            understands handmade creators.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sell"
              className={buttonVariants({
                size: "lg",
                className:
                  "text-lg px-8 py-4 bg-purple-600 hover:bg-purple-700",
              })}
            >
              Become a Founding Seller
            </Link>
            <Link
              href="/products"
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: "text-lg px-8 py-4",
              })}
            >
              Shop Handmade Goods
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

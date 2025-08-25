import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import SellPageClient from "@/components/seller/SellPageClient";
import {
  CheckCircle,
  Star,
  Users,
  Shield,
  Zap,
  Globe,
  Heart,
  TrendingUp,
  Award,
  Clock,
  DollarSign,
  Palette,
  MessageCircle,
  Truck,
  CreditCard,
} from "lucide-react";

// Add styles for Apply buttons
const applyButtonStyles = {
  cursor: "pointer",
  transition: "all 0.2s ease-in-out",
};

export const metadata = {
  title: "Become a Founding Seller - Yarnnu",
  description:
    "Join Yarnnu as one of our first 50 founding sellers. Get lifetime 8% commission (vs 10%), priority placement, early feature access, and showcase opportunities. Built by artisans, for artisans.",
};

export default function SellPage() {
  return (
    <SellPageClient>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-20">
            <div className="text-center max-w-4xl mx-auto">
              <Badge
                variant="secondary"
                className="mb-6 px-4 py-2 text-sm font-medium bg-purple-100 text-purple-800 border-purple-200"
              >
                <Award className="w-4 h-4 mr-2" />
                Founding Seller Program
              </Badge>

              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
                Be One of the First 50{" "}
                <span className="text-purple-600">Founding Sellers</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Secure your spot as one of Yarnnu&apos;s first 50 founding
                sellers. Get lifetime lower fees, extra visibility, and the
                chance to shape a marketplace built for handmade not
                dropshippers, not investors, just real creators like you making
                real things with care.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button
                  size="lg"
                  className="text-lg px-8 py-4 bg-purple-600 hover:bg-purple-700 apply-button"
                  style={applyButtonStyles}
                >
                  Join Now - Only 50 Spots
                </Button>
                <Link
                  href="#benefits"
                  className={buttonVariants({
                    variant: "outline",
                    size: "lg",
                    className: "text-lg px-8 py-4",
                  })}
                >
                  Learn More
                </Link>
              </div>

              {/* Founding Seller Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-purple-200 shadow-lg">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    Lower Fees, Forever
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Founding sellers lock in just 8% commission for life
                    (instead of 10%). It&apos;s our thank you for building
                    Yarnnu with us
                  </p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-purple-200 shadow-lg">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    Stand Out From Day One
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Your shop featured in search results and categories for your
                    first year giving you an early mover advantage
                  </p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-purple-200 shadow-lg">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    Spotlight on Your Work
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Founding sellers get priority in blogs, emails, and social
                    media promotions, helping you reach new buyers faster
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Yarnnu Section */}
        <section id="benefits" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Finally, a Marketplace That Puts Sellers First
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                You deserve a platform built for handmade sellers. With Yarnnu,
                you keep more of your earnings, get seen for your craft, and
                grow your brand without fighting against resellers or hidden
                fees.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Low Fees */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">
                    Keep More of What You Earn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Simple 10% commission (8% for founding sellers). No listing
                    fees, no ads you&apos;re forced to buy, no surprise charges.
                    We only make money when you do.
                  </CardDescription>
                </CardContent>
              </Card>

              {/* Quality Focus */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">
                    Stand Out as Authentic
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    No drop shippers, no AI junk, no factory goods. Every shop
                    is verified so your handmade work shines without being
                    buried.
                  </CardDescription>
                </CardContent>
              </Card>

              {/* Powerful Tools */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">
                    Tools That Grow Your Shop
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Run discounts, track sales, manage inventory, and see
                    what&apos;s working all designed to help handmade sellers
                    thrive.
                  </CardDescription>
                </CardContent>
              </Card>

              {/* Global Reach */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Globe className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">Reach More Buyers</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Sell worldwide with built-in international shipping and
                    multi-currency support, so your craft can find fans
                    anywhere.
                  </CardDescription>
                </CardContent>
              </Card>

              {/* Community */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Heart className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">
                    Your Voice Shapes the Platform
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    No investors, no boardroom decisions. Seller feedback drives
                    Yarnnu&apos;s future — built for makers, by makers.
                  </CardDescription>
                </CardContent>
              </Card>

              {/* Secure Payments */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">
                    Get Paid, Stress-Free
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Stripe-powered payouts, fraud protection, and secure
                    transactions mean you can focus on selling, not worrying.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Tools That Help Handmade Sellers Thrive
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                From beautiful shops to flexible shipping and fair pricing,
                Yarnnu gives you everything you need to sell more and stress
                less.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Palette className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Showcase Your Brand, Your Way
                    </h3>
                    <p className="text-gray-600">
                      Stand out with custom shop pages featuring banners, logos,
                      and stunning product displays.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Run Sales Without Penalties
                    </h3>
                    <p className="text-gray-600">
                      Create discounts, promo codes, and special offers with
                      zero hidden fees or forced ads.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Total Control Over Shipping
                    </h3>
                    <p className="text-gray-600">
                      Set custom shipping options, exclude countries, and price
                      shipping exactly how you need.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Connect Directly With Buyers
                    </h3>
                    <p className="text-gray-600">
                      Built-in messaging lets you answer questions, take custom
                      orders, and build relationships.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      Platform Commission
                    </span>
                    <span className="text-2xl font-bold text-purple-600">
                      10%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      Payment Processing
                    </span>
                    <span className="text-2xl font-bold text-purple-600">
                      2.9% + 30¢
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      Listing Fee
                    </span>
                    <span className="text-2xl font-bold text-purple-600">
                      $0
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      Monthly Fee
                    </span>
                    <span className="text-2xl font-bold text-purple-600">
                      $0
                    </span>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">Total Cost</span>
                      <span className="text-lg font-bold text-gray-900">
                        12.9% + 30¢
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Founding sellers: just 10.9% + 30¢
                    </p>
                  </div>
                </div>
                <p className="mt-6 text-base text-gray-700 font-medium text-center">
                  That&apos;s it. No listing fees. No renewal fees. No ads
                  you&apos;re forced to buy.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Founding Seller CTA */}
        <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="max-w-4xl mx-auto text-center px-4 md:px-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Become a Founding Seller Before Spots Run Out
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Secure lifetime lower fees, priority placement, and the chance to
              help shape a marketplace that protects handmade sellers not
              resellers or AI shops.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <CheckCircle className="w-8 h-8 mx-auto mb-3 text-purple-300" />
                <h3 className="font-semibold mb-2">Save Thousands Over Time</h3>
                <p className="text-sm opacity-80">
                  Lock in 2% commission savings for life exclusive to founding
                  sellers
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <Users className="w-8 h-8 mx-auto mb-3 text-purple-300" />
                <h3 className="font-semibold mb-2">Top Search Placement</h3>
                <p className="text-sm opacity-80">
                  Your shop featured in search results and categories for your
                  first year
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <Award className="w-8 h-8 mx-auto mb-3 text-purple-300" />
                <h3 className="font-semibold mb-2">
                  Featured Marketing Exposure
                </h3>
                <p className="text-sm opacity-80">
                  Showcased in emails, blogs, and social campaigns seen by
                  buyers
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="text-lg px-8 py-4 bg-white text-purple-600 hover:bg-gray-100 apply-button"
                style={applyButtonStyles}
              >
                Join Now - Only 50 Spots
              </Button>
              <Link
                href="/contact"
                className={buttonVariants({
                  size: "lg",
                  className:
                    "text-lg px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white hover:text-purple-600",
                })}
              >
                Have Questions?
              </Link>
            </div>

            <p className="text-sm opacity-75 mt-6">
              No upfront costs • Quick 24-48 hr approval • Founders get early
              feature access
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-8">
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold mb-3">
                  How long does the application process take?
                </h3>
                <p className="text-gray-600">
                  We review applications within 24-48 hours. Once approved, you
                  can start setting up your shop immediately.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold mb-3">
                  What are the requirements to become a seller?
                </h3>
                <p className="text-gray-600">
                  You must be 18+ years old, create handmade items, and agree to
                  our handmade policy. No prior online selling experience
                  required.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold mb-3">
                  Are there any upfront costs?
                </h3>
                <p className="text-gray-600">
                  No! There are no listing fees, monthly fees, or upfront costs.
                  You only pay when you make a sale.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold mb-3">
                  What makes Yarnnu different from other marketplaces?
                </h3>
                <p className="text-gray-600">
                  Yarnnu is built by artisans, for artisans. No investors means
                  we listen to sellers, not shareholders. We focus exclusively
                  on handmade goods, have transparent pricing, and maintain high
                  standards through seller verification.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold mb-3">
                  Can I sell internationally?
                </h3>
                <p className="text-gray-600">
                  Yes! We support international shipping and multi-currency
                  transactions. You can choose which countries you want to ship
                  to.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">
                  What support do you provide to sellers?
                </h3>
                <p className="text-gray-600">
                  Founding sellers get priority support, early access to new
                  features, and showcase opportunities in our marketing. All
                  sellers get access to our community and direct feedback
                  channels to shape the platform.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center px-4 md:px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Only 50 Founding Seller Spots - Will You Claim Yours?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Lock in lower fees, get priority placement, and help shape the
              future of handmade - built for sellers, not investors.
            </p>
            <Button
              size="lg"
              className="text-lg px-8 py-4 bg-purple-600 hover:bg-purple-700 apply-button"
              style={applyButtonStyles}
            >
              Join Now - Founding Seller Spots Are Limited
            </Button>
          </div>
        </section>
      </div>
    </SellPageClient>
  );
}

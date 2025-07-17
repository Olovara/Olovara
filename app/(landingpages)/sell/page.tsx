import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  CreditCard
} from "lucide-react";

// Add styles for Apply buttons
const applyButtonStyles = {
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
};

export const metadata = {
  title: "Become a Founding Seller - Yarnnu",
  description: "Join Yarnnu as one of our first 50 founding sellers. Get lifetime 8% commission (vs 10%), priority placement, early feature access, and showcase opportunities. Built by artisans, for artisans.",
};

export default function SellPage() {
  return (
    <SellPageClient>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium bg-purple-100 text-purple-800 border-purple-200">
              <Award className="w-4 h-4 mr-2" />
              Founding Seller Program
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
              Built by{" "}
              <span className="text-purple-600">Artisans</span>, for{" "}
              <span className="text-purple-600">Artisans</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Join Yarnnu as one of our first 50 founding sellers and be part of a marketplace 
              that truly understands handmade creators. No drop shippers, no AI-generated content, 
              just real people making real things with care.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                className="text-lg px-8 py-4 bg-purple-600 hover:bg-purple-700 apply-button"
                style={applyButtonStyles}
              >
                Apply Now - It&apos;s Free
              </Button>
              <Link href="#benefits" className={buttonVariants({ variant: "outline", size: "lg", className: "text-lg px-8 py-4" })}>
                Learn More
              </Link>
            </div>
            
            {/* Founding Seller Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-purple-200 shadow-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Lifetime 8% Commission</h3>
                <p className="text-gray-600 text-sm">Lock in 8% commission forever (vs 10% for regular sellers)</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-purple-200 shadow-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Priority Placement</h3>
                <p className="text-gray-600 text-sm">Featured in search results and categories for 1 year</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-purple-200 shadow-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Showcase Opportunities</h3>
                <p className="text-gray-600 text-sm">Featured in blogs, emails, and social media marketing</p>
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
              Why Yarnnu is Different
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Created by a husband who wanted to help his wife share her crochet creations, 
              Yarnnu is built from the ground up to serve handmade creators, not investors.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Low Fees */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">No Hidden Fees</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Simple 10% commission (8% for founding sellers). No listing fees, 
                  no advertising fees, no surprise charges. We only make money when you do.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Quality Focus */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Truly Handmade Only</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  No drop shippers, no AI-generated content, no factory-made goods. 
                  Every seller is verified to ensure authentic handmade products.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Powerful Tools */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Powerful Seller Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Advanced analytics, discount codes, sales promotions, and 
                  inventory management - everything you need to grow your business.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Global Reach */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Global Customer Base</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Reach customers worldwide with our international shipping 
                  and multi-currency support.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Community */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-pink-600" />
                </div>
                <CardTitle className="text-xl">Community-Driven</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Built without investors, so we listen to sellers, not shareholders. 
                  Your feedback shapes the platform&apos;s future.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Secure Payments */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle className="text-xl">Secure & Reliable</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Stripe-powered payments, secure transactions, and 
                  comprehensive fraud protection for peace of mind.
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
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform is designed with handmade sellers in mind, providing all the tools you need to run a successful business.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Palette className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Beautiful Shop Profiles</h3>
                  <p className="text-gray-600">Create stunning shop pages with custom banners, logos, and detailed product showcases.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Sales & Promotions</h3>
                  <p className="text-gray-600">Run sales, create discount codes, and boost your revenue with our powerful promotion tools.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Flexible Shipping</h3>
                  <p className="text-gray-600">Set up custom shipping profiles, exclude countries, and manage your shipping costs efficiently.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Customer Communication</h3>
                  <p className="text-gray-600">Built-in messaging system to communicate with customers and handle custom orders.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Platform Commission</span>
                  <span className="text-2xl font-bold text-green-600">10%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Payment Processing</span>
                  <span className="text-2xl font-bold text-blue-600">2.9% + 30¢</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Listing Fee</span>
                  <span className="text-2xl font-bold text-purple-600">$0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Monthly Fee</span>
                  <span className="text-2xl font-bold text-purple-600">$0</span>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Total Cost</span>
                    <span className="text-lg font-bold text-gray-900">12.9% + 30¢</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Founding sellers: 10.9% + 30¢</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founding Seller CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Join Our First 50 Founding Sellers
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Be part of something special from the beginning. Get lifetime 8% commission, 
            priority placement, and help shape a marketplace built for artisans, by artisans.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <CheckCircle className="w-8 h-8 mx-auto mb-3 text-green-300" />
              <h3 className="font-semibold mb-2">Lifetime 8% Commission</h3>
              <p className="text-sm opacity-80">Lock in 2% savings forever</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <Users className="w-8 h-8 mx-auto mb-3 text-blue-300" />
              <h3 className="font-semibold mb-2">Priority Placement</h3>
              <p className="text-sm opacity-80">Featured in search for 1 year</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <Award className="w-8 h-8 mx-auto mb-3 text-yellow-300" />
              <h3 className="font-semibold mb-2">Showcase Opportunities</h3>
              <p className="text-sm opacity-80">Featured in marketing campaigns</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-4 bg-white text-purple-600 hover:bg-gray-100 apply-button"
              style={applyButtonStyles}
            >
              Apply Now - Limited Time
            </Button>
            <Link href="/contact" className={buttonVariants({ size: "lg", className: "text-lg px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white hover:text-purple-600" })}>
              Have Questions?
            </Link>
          </div>
          
          <p className="text-sm opacity-75 mt-6">
            Applications are reviewed within 24-48 hours • No upfront costs • Early access to new features
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
              <h3 className="text-lg font-semibold mb-3">How long does the application process take?</h3>
              <p className="text-gray-600">We review applications within 24-48 hours. Once approved, you can start setting up your shop immediately.</p>
            </div>
            
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold mb-3">What are the requirements to become a seller?</h3>
              <p className="text-gray-600">You must be 18+ years old, create handmade items, and agree to our handmade policy. No prior online selling experience required.</p>
            </div>
            
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold mb-3">Are there any upfront costs?</h3>
              <p className="text-gray-600">No! There are no listing fees, monthly fees, or upfront costs. You only pay when you make a sale.</p>
            </div>
            
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold mb-3">What makes Yarnnu different from other marketplaces?</h3>
              <p className="text-gray-600">Yarnnu is built by artisans, for artisans. No investors means we listen to sellers, not shareholders. We focus exclusively on handmade goods, have transparent pricing, and maintain high standards through seller verification.</p>
            </div>
            
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold mb-3">Can I sell internationally?</h3>
              <p className="text-gray-600">Yes! We support international shipping and multi-currency transactions. You can choose which countries you want to ship to.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">What support do you provide to sellers?</h3>
              <p className="text-gray-600">Founding sellers get priority support, early access to new features, and showcase opportunities in our marketing. All sellers get access to our community and direct feedback channels to shape the platform.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Ready to Start Your Handmade Business Journey?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join Yarnnu today and be part of a marketplace that truly values craftsmanship.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-4 bg-purple-600 hover:bg-purple-700 apply-button"
            style={applyButtonStyles}
          >
            Apply Now - It&apos;s Free
          </Button>
        </div>
      </section>
      </div>
    </SellPageClient>
  );
} 
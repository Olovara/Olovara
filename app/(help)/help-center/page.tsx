import { Metadata } from "next"
import Link from "next/link"
import { 
  Search, 
  BookOpen, 
  Store, 
  CreditCard, 
  Truck, 
  MessageSquare, 
  TrendingUp,
  Shield,
  Settings,
  ArrowRight,
  Star
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export const metadata: Metadata = {
  title: "Help Center | Yarnnu",
  description: "Get help with selling on Yarnnu. Find guides, tutorials, and support for sellers.",
}

const featuredGuides = [
  {
    title: "Seller Application Process",
    description: "Complete step-by-step guide to applying as a seller on Yarnnu",
    href: "/help-center/seller-application",
    icon: BookOpen,
    featured: true
  },
  {
    title: "Setting Up Your Shop",
    description: "Learn how to create and customize your shop profile",
    href: "/help-center/shop-setup",
    icon: Store,
    featured: true
  },
  {
    title: "Stripe Connect Setup",
    description: "Secure payment processing setup for your shop",
    href: "/help-center/stripe-setup",
    icon: CreditCard,
    featured: true
  },
  {
    title: "Creating Your First Product",
    description: "Step-by-step guide to listing your first handmade item",
    href: "/help-center/create-product",
    icon: Store,
    featured: false
  },
  {
    title: "Shipping Profiles",
    description: "Set up shipping options and rates for your products",
    href: "/help-center/shipping-profiles",
    icon: Truck,
    featured: false
  },
  {
    title: "Handmade Guidelines",
    description: "Understanding what qualifies as handmade on Yarnnu",
    href: "/help-center/handmade-guidelines",
    icon: Shield,
    featured: false
  }
]

const quickLinks = [
  {
    title: "Getting Started",
    description: "New seller onboarding",
    href: "/help-center/seller-application",
    icon: BookOpen,
    color: "bg-purple-100 text-purple-600"
  },
  {
    title: "Shop Management",
    description: "Products, policies, customization",
    href: "/help-center/shop-setup",
    icon: Store,
    color: "bg-green-100 text-green-600"
  },
  {
    title: "Payments & Finances",
    description: "Stripe setup, fees, taxes",
    href: "/help-center/stripe-setup",
    icon: CreditCard,
    color: "bg-purple-100 text-purple-600"
  },
  {
    title: "Shipping & Fulfillment",
    description: "Shipping profiles, packaging, orders",
    href: "/help-center/shipping-profiles",
    icon: Truck,
    color: "bg-orange-100 text-orange-600"
  },
  {
    title: "Customer Service",
    description: "Messaging, inquiries, returns",
    href: "/help-center/messaging",
    icon: MessageSquare,
    color: "bg-pink-100 text-pink-600"
  },
  {
    title: "Growth & Marketing",
    description: "SEO, promotions, analytics",
    href: "/help-center/seo",
    icon: TrendingUp,
    color: "bg-indigo-100 text-indigo-600"
  }
]

export default function HelpCenterPage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          How can we help you?
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Everything you need to know about selling on Yarnnu. From getting started to growing your business.
        </p>
        
        {/* Search Bar */}
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search help articles..."
            className="pl-10 pr-4 py-3"
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group block p-6 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-lg ${link.color}`}>
                  <link.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                    {link.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {link.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Guides */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Featured Guides</h2>
          <Link href="/help-center" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
            View all guides →
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredGuides.filter(guide => guide.featured).map((guide) => (
            <Link
              key={guide.href}
              href={guide.href}
              className="group block p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <guide.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-xs font-medium text-purple-600">Featured</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {guide.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-purple-400 group-hover:text-purple-600 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Popular Topics */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Popular Topics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredGuides.filter(guide => !guide.featured).map((guide) => (
            <Link
              key={guide.href}
              href={guide.href}
              className="group block p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                  <guide.icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 group-hover:text-purple-600 transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {guide.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold">Still need help?</h3>
          <p className="text-purple-100">
            Can&apos;t find what you&apos;re looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="secondary" size="lg">
              Contact Support
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-purple-600">
              Live Chat
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

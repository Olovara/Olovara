"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Menu as MenuIcon, ChevronRight, ArrowLeft, BookOpen, Store, CreditCard, Truck, MessageSquare, Settings, Shield, TrendingUp, Users, FileText } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

type ViewState = 'main' | 'category'

const helpCategories = [
  {
    title: "Getting Started",
    icon: BookOpen,
    items: [
      { title: "Seller Application Process", href: "/help-center/seller-application" },
      { title: "Setting Up Your Shop", href: "/help-center/shop-setup" },
      { title: "Profile & Verification", href: "/help-center/profile-verification" },
    ]
  },
  {
    title: "Shop Management",
    icon: Store,
    items: [
      { title: "Creating Your First Product", href: "/help-center/create-product" },
      { title: "Product Categories & Tags", href: "/help-center/product-categories" },
      { title: "Shop Policies", href: "/help-center/shop-policies" },
      { title: "Shop Customization", href: "/help-center/shop-customization" },
    ]
  },
  {
    title: "Payments & Finances",
    icon: CreditCard,
    items: [
      { title: "Stripe Connect Setup", href: "/help-center/stripe-setup" },
      { title: "Payment Processing", href: "/help-center/payment-processing" },
      { title: "Pricing & Fees", href: "/help-center/pricing-fees" },
      { title: "Tax Information", href: "/help-center/tax-info" },
    ]
  },
  {
    title: "Shipping & Fulfillment",
    icon: Truck,
    items: [
      { title: "Shipping Options", href: "/help-center/shipping-options" },
      { title: "Packaging Guidelines", href: "/help-center/packaging" },
      { title: "Order Fulfillment", href: "/help-center/order-fulfillment" },
      { title: "International Shipping", href: "/help-center/international-shipping" },
    ]
  },
  {
    title: "Customer Service",
    icon: MessageSquare,
    items: [
      { title: "Messaging System", href: "/help-center/messaging" },
      { title: "Handling Inquiries", href: "/help-center/customer-inquiries" },
      { title: "Returns & Refunds", href: "/help-center/returns-refunds" },
      { title: "Dispute Resolution", href: "/help-center/disputes" },
    ]
  },
  {
    title: "Growth & Marketing",
    icon: TrendingUp,
    items: [
      { title: "SEO & Discoverability", href: "/help-center/seo" },
      { title: "Promotional Tools", href: "/help-center/promotions" },
      { title: "Social Media Integration", href: "/help-center/social-media" },
      { title: "Analytics & Insights", href: "/help-center/analytics" },
    ]
  },
  {
    title: "Policies & Compliance",
    icon: Shield,
    items: [
      { title: "Handmade Guidelines", href: "/help-center/handmade-guidelines" },
      { title: "Prohibited Items", href: "/help-center/prohibited-items" },
      { title: "Copyright & IP", href: "/help-center/copyright" },
      { title: "Terms of Service", href: "/help-center/terms" },
    ]
  },
  {
    title: "Account & Settings",
    icon: Settings,
    items: [
      { title: "Account Security", href: "/help-center/security" },
      { title: "Notification Settings", href: "/help-center/notifications" },
      { title: "Privacy Settings", href: "/help-center/privacy" },
      { title: "Account Deletion", href: "/help-center/account-deletion" },
    ]
  }
]

export function HelpCenterMobileNav() {
  const pathname = usePathname()
  const [viewState, setViewState] = useState<ViewState>('main')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const handleCategoryClick = (categoryTitle: string) => {
    setSelectedCategory(categoryTitle)
    setViewState('category')
  }

  const handleBack = () => {
    setViewState('main')
    setSelectedCategory(null)
  }

  const getCurrentCategory = () => helpCategories.find(cat => cat.title === selectedCategory)

  const renderMainView = () => (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg text-gray-900">Help Categories</h3>
      <div className="space-y-2">
        {helpCategories.map((category) => (
          <button
            key={category.title}
            onClick={() => handleCategoryClick(category.title)}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors rounded-md"
          >
            <div className="flex items-center space-x-3">
              <div className="p-1 bg-purple-100 text-purple-600 rounded">
                <category.icon className="w-4 h-4" />
              </div>
              <span className="font-medium text-gray-900">{category.title}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        ))}
      </div>
    </div>
  )

  const renderCategoryView = () => {
    const category = getCurrentCategory()
    if (!category) return null

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <button onClick={handleBack} className="flex items-center gap-1 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <ChevronRight className="w-3 h-3" />
          <span className="font-medium text-gray-900">{category.title}</span>
        </div>
        
        <div className="space-y-2">
          {category.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block p-3 text-left hover:bg-gray-50 transition-colors rounded-md ${
                pathname === item.href ? 'bg-purple-50 text-purple-600' : ''
              }`}
            >
              <span className="font-medium">{item.title}</span>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Open help center menu" className="lg:hidden">
          <MenuIcon className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="top" className="w-full h-full p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-purple-100">
            <SheetTitle className="text-xl font-semibold text-left">
              Help Center
            </SheetTitle>
            <SheetDescription className="text-left mt-1">
              Everything you need to know about selling on Yarnnu
            </SheetDescription>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Links */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  href="/help-center/seller-application"
                  className="block p-3 text-left hover:bg-gray-50 transition-colors rounded-md"
                >
                  <span className="font-medium text-gray-900">Seller Application</span>
                </Link>
                <Link
                  href="/help-center/shop-setup"
                  className="block p-3 text-left hover:bg-gray-50 transition-colors rounded-md"
                >
                  <span className="font-medium text-gray-900">Shop Setup</span>
                </Link>
                <Link
                  href="/help-center/stripe-setup"
                  className="block p-3 text-left hover:bg-gray-50 transition-colors rounded-md"
                >
                  <span className="font-medium text-gray-900">Payment Setup</span>
                </Link>
              </div>
            </div>

            {/* Navigation */}
            {viewState === 'main' && renderMainView()}
            {viewState === 'category' && renderCategoryView()}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-100">
            <div className="flex flex-col space-y-2">
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900 text-center"
              >
                Back to Yarnnu Home
              </Link>
              <p className="text-xs text-gray-500 text-center">
                &copy; {new Date().getFullYear()} Yarnnu. All Rights Reserved
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

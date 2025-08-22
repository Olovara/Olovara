"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  BookOpen, 
  Store, 
  CreditCard, 
  Truck, 
  MessageSquare, 
  Settings,
  FileText,
  Shield,
  TrendingUp,
  Users
} from "lucide-react"

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

export function HelpCenterNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-6">
      {helpCategories.map((category) => (
        <div key={category.title} className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <category.icon className="h-4 w-4" />
            {category.title}
          </div>
          <ul className="space-y-1 ml-6">
            {category.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "block text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 px-2 py-1 rounded transition-colors",
                    pathname === item.href && "text-purple-600 bg-purple-50 font-medium"
                  )}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
} 
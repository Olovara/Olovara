import { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Palette,
  Info,
  Camera,
  Settings,
  FileText,
  Star,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Setting Up Your Shop | Help Center | OLOVARA",
  description:
    "Complete guide to setting up and customizing your OLOVARA shop. Learn about shop profiles, branding, and optimization.",
};

const setupSteps = [
  {
    step: 1,
    title: "Shop Profile Basics",
    description: "Set up your fundamental shop information",
    details: [
      "Choose your shop name (unique and memorable)",
      "Write your shop description",
      "Set your shop location",
    ],
    tips: [
      "Shop name should reflect your brand and be easy to remember",
      "Description should tell your story and highlight your craftsmanship",
      "Choose the most relevant category for better discoverability",
      "Accurate location helps with buyer discovery and customer trust",
    ],
    estimatedTime: "15 minutes",
  },
  {
    step: 2,
    title: "Shop Banner & Logo",
    description: "Create visual branding for your shop",
    details: [
      "Upload a high-quality shop banner (1200x300px recommended)",
      "Add your shop logo (square format, 300x300px)",
      "Ensure images represent your brand and products",
      "Use consistent color schemes and fonts",
    ],
    tips: [
      "Banner should showcase your best work or brand aesthetic",
      "Logo should be simple, recognizable, and work in small sizes",
      "Use high-resolution images for crisp display",
      "Consider seasonal updates to keep your shop fresh",
    ],
    estimatedTime: "20 minutes",
  },
  {
    step: 3,
    title: "Shop Policies",
    description: "Set clear expectations for your customers",
    details: [
      "Write your shipping policy",
      "Define your return and refund policy",
      "Create custom policies for your shop",
      "Set processing times for orders",
    ],
    tips: [
      "Be specific about shipping times and costs",
      "Clear return policies build customer confidence",
      "Custom policies can address unique aspects of your products",
      "Realistic processing times prevent customer frustration",
    ],
    estimatedTime: "25 minutes",
  },
  {
    step: 4,
    title: "Shop Sections",
    description: "Organize your products for better navigation",
    details: [
      "Create product categories/sections",
      "Add section descriptions",
      "Organize products logically",
      "Use consistent naming conventions",
    ],
    tips: [
      "Sections help customers find what they're looking for quickly",
      "Group similar items together",
      "Use descriptive section names",
      "Consider seasonal or themed sections",
    ],
    estimatedTime: "15 minutes",
  },
  {
    step: 5,
    title: "About Section",
    description: "Tell your story and build customer connections",
    details: [
      "Write your shop story and background",
      "Share your crafting journey",
      "Include photos of your workspace",
      "Add personal touches that make you unique",
    ],
    tips: [
      "Authentic stories create emotional connections with customers",
      "Include your inspiration and creative process",
      "Workspace photos show the handmade nature of your work",
      "Personal details help customers relate to you as an artist",
    ],
    estimatedTime: "30 minutes",
  },
  {
    step: 6,
    title: "SEO & Discoverability",
    description: "Optimize your shop for search and discovery",
    details: [
      "Add relevant keywords to your shop description",
      "Use descriptive product titles",
      "Include location-based terms if applicable",
      "Link to your social media profiles",
    ],
    tips: [
      "Research keywords that customers use to find your type of products",
      "Include your location if it's relevant to your brand",
      "Social media links help customers connect with you",
      "Regular updates keep your shop active in search results",
    ],
    estimatedTime: "20 minutes",
  },
];

const shopElements = [
  {
    title: "Shop Name",
    description: "Your unique identifier on OLOVARA",
    importance: "Critical",
    tips: [
      "Must be unique across the platform",
      "Should reflect your brand identity",
      "Keep it memorable and easy to spell",
      "Avoid numbers unless part of your brand",
    ],
    icon: Star,
  },
  {
    title: "Shop Description",
    description: "Tells customers about your shop and products",
    importance: "High",
    tips: [
      "Include your story and inspiration",
      "Mention your crafting techniques",
      "Highlight what makes you unique",
      "Use keywords for better search visibility",
    ],
    icon: FileText,
  },
  {
    title: "Shop Banner",
    description: "Visual representation of your brand",
    importance: "High",
    tips: [
      "Use high-quality, professional images",
      "Showcase your best work or brand aesthetic",
      "Ensure text is readable if included",
      "Keep file size under 2MB for fast loading",
    ],
    icon: Camera,
  },
  {
    title: "Shop Logo",
    description: "Your brand symbol across the platform",
    importance: "Medium",
    tips: [
      "Simple, recognizable design",
      "Works well in small sizes",
      "Consistent with your overall branding",
      "Professional and polished appearance",
    ],
    icon: Palette,
  },
  {
    title: "Shop Policies",
    description: "Sets customer expectations and builds trust",
    importance: "Critical",
    tips: [
      "Clear, detailed policies reduce customer questions",
      "Include all important terms and conditions",
      "Be specific about shipping and return processes",
      "Update policies as your business evolves",
    ],
    icon: Settings,
  },
  {
    title: "Location & Shipping",
    description: "Affects shipping calculations and customer trust",
    importance: "High",
    tips: [
      "Accurate location helps with shipping estimates",
      "Consider multiple shipping origins if applicable",
      "Be transparent about processing times",
      "Include any shipping restrictions or limitations",
    ],
    icon: MapPin,
  },
];

const optimizationTips = [
  {
    category: "Branding",
    tips: [
      "Use consistent colors and fonts across all elements",
      "Create a cohesive visual identity",
      "Tell your unique story authentically",
      "Show your personality while remaining professional",
    ],
  },
  {
    category: "SEO & Discovery",
    tips: [
      "Use relevant keywords naturally in descriptions",
      "Include location terms if relevant to your brand",
      "Regular updates keep your shop active",
      "Link to social media for broader reach",
    ],
  },
  {
    category: "Customer Experience",
    tips: [
      "Clear policies reduce customer confusion",
      "Professional photos build trust",
      "Detailed descriptions help customers make decisions",
      "Quick response times improve customer satisfaction",
    ],
  },
  {
    category: "Trust & Credibility",
    tips: [
      "Complete profile information builds trust",
      "High-quality images show professionalism",
      "Clear policies demonstrate reliability",
      "Personal touches create emotional connections",
    ],
  },
];

const commonMistakes = [
  {
    mistake: "Incomplete Profiles",
    description:
      "Shops with missing information appear less professional and trustworthy to customers",
    solution:
      "Complete all profile sections with detailed, accurate information",
  },
  {
    mistake: "Poor Quality Images",
    description:
      "Blurry or poorly lit photos make your products look unprofessional and reduce customer confidence",
    solution:
      "Invest in good photography or learn basic photo editing techniques",
  },
  {
    mistake: "Vague Policies",
    description:
      "Unclear shipping, return, or processing policies lead to customer confusion and potential disputes",
    solution:
      "Create specific, detailed policies that address common customer questions",
  },
  {
    mistake: "Generic Descriptions",
    description:
      "Copy-pasted or generic shop descriptions don't help customers connect with your unique brand and story",
    solution:
      "Write authentic descriptions that reflect your personality and craftsmanship",
  },
];

export default function ShopSetupPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Link
            href="/help-center"
            className="hover:text-purple-600 transition-colors"
          >
            Help Center
          </Link>
          <span>/</span>
          <span>Setting Up Your Shop</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900">
          Setting Up Your Shop
        </h1>
        <p className="text-lg text-gray-600">
          Complete guide to creating and customizing your shop profile on
          OLOVARA. Learn how to build a professional, discoverable shop that
          attracts customers and builds trust.
        </p>
      </div>

      {/* Overview Alert */}
      <Alert className="border-purple-200 bg-purple-50">
        <Info className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-800">
          <strong>Shop Setup Timeline:</strong> Plan for 2-3 hours to complete
          your initial shop setup. You can always update and improve your shop
          over time as your business grows.
        </AlertDescription>
      </Alert>

      {/* Shop Elements Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">
          Essential Shop Elements
        </h2>
        <p className="text-gray-600">
          Your shop profile consists of several key elements that work together
          to create a professional, trustworthy presence on OLOVARA:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shopElements.map((element) => (
            <div
              key={element.title}
              className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <element.icon className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-gray-900">
                      {element.title}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        element.importance === "Critical"
                          ? "bg-red-100 text-red-700"
                          : element.importance === "High"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                      }`}
                    >
                      {element.importance}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {element.description}
                  </p>
                  <ul className="space-y-1">
                    {element.tips.map((tip, index) => (
                      <li
                        key={index}
                        className="flex items-start space-x-2 text-xs text-gray-600"
                      >
                        <CheckCircle className="h-3 w-3 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Setup Steps */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Shop Setup Process
        </h2>

        {setupSteps.map((step) => (
          <div
            key={step.step}
            className="border border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-colors"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full flex items-center justify-center font-semibold">
                {step.step}
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 mt-1">{step.description}</p>
                  <div className="flex items-center space-x-2 mt-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>Estimated time: {step.estimatedTime}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      What you&apos;ll do:
                    </h4>
                    <ul className="space-y-1">
                      {step.details.map((detail, detailIndex) => (
                        <li
                          key={detailIndex}
                          className="flex items-start space-x-2 text-sm text-gray-600"
                        >
                          <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Pro Tips:
                    </h4>
                    <ul className="space-y-1">
                      {step.tips.map((tip, tipIndex) => (
                        <li
                          key={tipIndex}
                          className="flex items-start space-x-2 text-sm text-gray-600"
                        >
                          <AlertCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Optimization Tips */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">
          Shop Optimization Tips
        </h2>
        <p className="text-gray-600">
          These strategies will help you create a shop that attracts customers
          and builds lasting relationships:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {optimizationTips.map((category) => (
            <div
              key={category.category}
              className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-3">
                {category.category}
              </h3>
              <ul className="space-y-2">
                {category.tips.map((tip, index) => (
                  <li
                    key={index}
                    className="flex items-start space-x-2 text-sm text-gray-600"
                  >
                    <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Common Mistakes */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">
          Common Shop Setup Mistakes
        </h2>
        <p className="text-gray-600">
          Avoid these common pitfalls that can hurt your shop&apos;s success:
        </p>

        <div className="space-y-4">
          {commonMistakes.map((mistake) => (
            <div
              key={mistake.mistake}
              className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900">
                    {mistake.mistake}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {mistake.description}
                  </p>
                  <p className="text-sm text-purple-600 mt-2">
                    <strong>Solution:</strong> {mistake.solution}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Ready to Set Up Your Shop?
        </h2>
        <p className="text-gray-600 mb-4">
          Now that you understand the shop setup process, you&apos;re ready to
          create a professional, discoverable shop that will attract customers
          and build lasting relationships.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <Link href="/seller/dashboard/settings">Go to Shop Settings</Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="border-purple-300 text-purple-600 hover:bg-purple-50"
          >
            <Link href="/help-center/create-product">
              Next: Creating Your First Product →
            </Link>
          </Button>
        </div>
      </div>

      {/* Related Articles */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Related Articles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/help-center/create-product"
            className="block p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all"
          >
            <h3 className="font-medium text-gray-900">
              Creating Your First Product
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Step-by-step guide to listing your first handmade item
            </p>
          </Link>
          <Link
            href="/help-center/shop-policies"
            className="block p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all"
          >
            <h3 className="font-medium text-gray-900">Shop Policies</h3>
            <p className="text-sm text-gray-600 mt-1">
              Learn how to create effective shop policies
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

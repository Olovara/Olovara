import { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Camera,
  DollarSign,
  Info,
  Tag,
  Package,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Creating Your First Product | Help Center | Yarnnu",
  description:
    "Complete step-by-step guide to creating your first product listing on Yarnnu. Learn about photos, descriptions, pricing, and optimization.",
};

const productSteps = [
  {
    step: 1,
    title: "Product Photos",
    description:
      "Create compelling visual content that showcases your handmade item",
    details: [
      "Take 5-10 high-quality photos",
      "Include close-ups of craftsmanship details",
      "Show product in use or styled",
      "Use natural lighting for best results",
    ],
    tips: [
      "First photo should be your best shot - it's the main image",
      "Include photos from different angles",
      "Show scale with common objects or measurements",
      "Avoid filters that change product colors",
    ],
    estimatedTime: "30-45 minutes",
  },
  {
    step: 2,
    title: "Product Information",
    description:
      "Write detailed, accurate information about your handmade item",
    details: [
      "Create a clear, descriptive title",
      "Write a compelling product description",
      "List materials and dimensions",
      "Specify processing time and care instructions",
    ],
    tips: [
      "Use keywords naturally in your title and description",
      "Include what makes your item unique",
      "Be specific about materials and techniques",
      "Mention any customization options",
    ],
    estimatedTime: "20-30 minutes",
  },
  {
    step: 3,
    title: "Pricing Strategy",
    description:
      "Set competitive pricing that reflects your craftsmanship and costs",
    details: [
      "Calculate your material and time costs",
      "Research similar products in your category",
      "Consider your target market",
      "Factor in platform fees and shipping",
    ],
    tips: [
      "Don't undervalue your work - quality handmade items deserve fair pricing",
      "Consider offering different price points for similar items",
      "Include shipping costs in your pricing strategy",
      "Review and adjust prices regularly based on demand",
    ],
    estimatedTime: "15-20 minutes",
  },
  {
    step: 4,
    title: "Categories & Tags",
    description:
      "Help customers find your product through proper categorization",
    details: [
      "Select the most specific category available",
      "Add relevant tags and keywords",
      "Include material and style tags",
      "Use seasonal or occasion tags if applicable",
    ],
    tips: [
      "Choose the most specific category that fits your item",
      "Use tags that customers would search for",
      "Include both broad and specific terms",
      "Update tags seasonally for better discoverability",
    ],
    estimatedTime: "10 minutes",
  },
  {
    step: 5,
    title: "Shipping & Inventory",
    description: "Set up shipping options and manage your inventory",
    details: [
      "Choose shipping options and rates",
      "Set processing time for orders",
      "Determine inventory quantity",
      "Configure shipping restrictions if any",
    ],
    tips: [
      "Be realistic about processing times",
      "Consider offering multiple shipping speeds",
      "Set appropriate inventory levels",
      "Update processing times for custom orders",
    ],
    estimatedTime: "15 minutes",
  },
  {
    step: 6,
    title: "Review & Publish",
    description: "Final review and publication of your product listing",
    details: [
      "Review all information for accuracy",
      "Check photos for quality and clarity",
      "Verify pricing and shipping details",
      "Publish and monitor performance",
    ],
    tips: [
      "Have someone else review your listing",
      "Test the customer experience from their perspective",
      "Monitor views and favorites after publishing",
      "Be ready to respond to customer questions quickly",
    ],
    estimatedTime: "10 minutes",
  },
];

const essentialElements = [
  {
    title: "High-Quality Photos",
    description: "Clear, well-lit images that showcase your craftsmanship",
    importance: "Critical",
    tips: [
      "Use natural lighting whenever possible",
      "Show multiple angles of your product",
      "Include close-ups of unique details",
      "Ensure colors are accurate and true-to-life",
    ],
    icon: Camera,
  },
  {
    title: "Compelling Title",
    description: "Clear, descriptive title that includes key features",
    importance: "Critical",
    tips: [
      "Include the main product type and key features",
      "Use relevant keywords naturally",
      "Keep it under 60 characters for best display",
      "Avoid generic terms like 'beautiful' or 'amazing'",
    ],
    icon: FileText,
  },
  {
    title: "Detailed Description",
    description: "Comprehensive information about your handmade item",
    importance: "High",
    tips: [
      "Tell the story behind your creation",
      "Include materials, dimensions, and care instructions",
      "Mention any customization options",
      "Use bullet points for easy scanning",
    ],
    icon: FileText,
  },
  {
    title: "Accurate Pricing",
    description: "Fair pricing that reflects your craftsmanship and costs",
    importance: "High",
    tips: [
      "Calculate all costs including materials and time",
      "Research similar products in your category",
      "Consider your target market and positioning",
      "Factor in platform fees and shipping costs",
    ],
    icon: DollarSign,
  },
  {
    title: "Proper Categorization",
    description: "Correct category and tags for discoverability",
    importance: "High",
    tips: [
      "Choose the most specific category available",
      "Add relevant tags that customers search for",
      "Include material and style keywords",
      "Update tags seasonally for better visibility",
    ],
    icon: Tag,
  },
  {
    title: "Shipping Information",
    description: "Clear shipping options and processing times",
    importance: "Medium",
    tips: [
      "Set realistic processing times",
      "Offer multiple shipping speed options",
      "Be clear about shipping costs and policies",
      "Update processing times for custom orders",
    ],
    icon: Package,
  },
];

const optimizationTips = [
  {
    category: "Photography",
    tips: [
      "Use natural lighting for the most accurate colors",
      "Show your product in context or being used",
      "Include close-ups of unique craftsmanship details",
      "Keep backgrounds simple and uncluttered",
    ],
  },
  {
    category: "SEO & Discovery",
    tips: [
      "Use relevant keywords naturally in titles and descriptions",
      "Include location-based terms if relevant to your brand",
      "Add seasonal or occasion-specific tags",
      "Regularly update listings to stay active in search",
    ],
  },
  {
    category: "Customer Experience",
    tips: [
      "Provide detailed care and usage instructions",
      "Include sizing information when applicable",
      "Mention any customization or personalization options",
      "Respond quickly to customer questions and inquiries",
    ],
  },
  {
    category: "Trust & Credibility",
    tips: [
      "Be honest about materials and construction methods",
      "Show the handmade nature of your work clearly",
      "Include your story and inspiration when relevant",
      "Maintain consistent quality across all your products",
    ],
  },
];

const commonMistakes = [
  {
    mistake: "Poor Quality Photos",
    description:
      "Blurry, dark, or unclear images that don't showcase your product properly",
    solution:
      "Invest time in good photography - it's often the first thing customers see",
  },
  {
    mistake: "Vague Descriptions",
    description:
      "Generic descriptions that don't highlight what makes your item unique",
    solution: "Be specific about materials, techniques, and unique features",
  },
  {
    mistake: "Incorrect Pricing",
    description:
      "Pricing too low (undervaluing your work) or too high (pricing out your market)",
    solution:
      "Research your market and calculate all costs including your time",
  },
  {
    mistake: "Wrong Categories",
    description: "Placing items in incorrect or too broad categories",
    solution:
      "Choose the most specific category that accurately describes your item",
  },
  {
    mistake: "Missing Information",
    description:
      "Leaving out important details like dimensions, materials, or care instructions",
    solution:
      "Think like a customer - what would you want to know before buying?",
  },
];

const photoGuidelines = [
  {
    requirement: "Main Photo",
    description: "Your best shot - this is what customers see first",
    tips: [
      "Show the full product clearly",
      "Use natural lighting",
      "Keep background simple",
      "Ensure colors are accurate",
    ],
  },
  {
    requirement: "Detail Shots",
    description: "Close-ups of craftsmanship and unique features",
    tips: [
      "Highlight handmade details",
      "Show quality of materials",
      "Include any special techniques",
      "Demonstrate workmanship",
    ],
  },
  {
    requirement: "Context Photos",
    description: "Show your product in use or styled",
    tips: [
      "Show scale and proportions",
      "Demonstrate functionality",
      "Include lifestyle shots",
      "Help customers visualize use",
    ],
  },
  {
    requirement: "Technical Requirements",
    description: "Meet platform standards for best display",
    tips: [
      "Minimum 1000x1000 pixels",
      "Square format recommended",
      "File size under 5MB",
      "High resolution for zooming",
    ],
  },
];

export default function CreateProductPage() {
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
          <span>Creating Your First Product</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900">
          Creating Your First Product
        </h1>
        <p className="text-lg text-gray-600">
          Complete step-by-step guide to creating compelling product listings on
          Yarnnu. Learn how to showcase your handmade items with professional
          photos, compelling descriptions, and optimal pricing.
        </p>
      </div>

      {/* Overview Alert */}
      <Alert className="border-purple-200 bg-purple-50">
        <Info className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-800">
          <strong>Product Creation Timeline:</strong> Plan for 1-2 hours to
          create your first product listing. Quality photos and descriptions are
          crucial for attracting customers and making sales.
        </AlertDescription>
      </Alert>

      {/* Essential Elements */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">
          Essential Product Elements
        </h2>
        <p className="text-gray-600">
          These elements are crucial for creating successful product listings
          that convert browsers into buyers:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {essentialElements.map((element) => (
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

      {/* Photo Guidelines */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">
          Photo Guidelines
        </h2>
        <p className="text-gray-600">
          Professional photos are essential for showcasing your handmade items
          and attracting customers:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {photoGuidelines.map((guideline) => (
            <div
              key={guideline.requirement}
              className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <Camera className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">
                    {guideline.requirement}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {guideline.description}
                  </p>
                  <ul className="space-y-1">
                    {guideline.tips.map((tip, index) => (
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

      {/* Product Creation Steps */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Product Creation Process
        </h2>

        {productSteps.map((step) => (
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
          Product Optimization Tips
        </h2>
        <p className="text-gray-600">
          These strategies will help your products stand out and attract more
          customers:
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
          Common Product Creation Mistakes
        </h2>
        <p className="text-gray-600">
          Avoid these common pitfalls that can hurt your product&apos;s success:
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
          Ready to Create Your First Product?
        </h2>
        <p className="text-gray-600 mb-4">
          Now that you understand the product creation process, you&apos;re
          ready to showcase your handmade items with professional listings that
          attract customers and drive sales.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <Link href="/seller/dashboard/products/create-product">
              Create Your First Product
            </Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="border-purple-300 text-purple-600 hover:bg-purple-50"
          >
            <Link href="/help-center/shipping-options">
              Next: Setting Up Shipping →
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
            href="/help-center/shipping-profiles"
            className="block p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all"
          >
            <h3 className="font-medium text-gray-900">Shipping Options</h3>
            <p className="text-sm text-gray-600 mt-1">
              Set up shipping options and rates for your products
            </p>
          </Link>
          <Link
            href="/help-center/product-photography"
            className="block p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all"
          >
            <h3 className="font-medium text-gray-900">Product Photography</h3>
            <p className="text-sm text-gray-600 mt-1">
              Advanced tips for taking professional product photos
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

import { Metadata } from "next";
import Link from "next/link";
import {
  Truck,
  Globe,
  DollarSign,
  Clock,
  Settings,
  AlertCircle,
  CheckCircle,
  Info,
  MapPin,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Shipping Options | Help Center | Yarnnu",
  description:
    "Complete guide to setting up shipping options and rates on Yarnnu. Learn how to configure domestic and international shipping options.",
};

const shippingZones = [
  {
    name: "North America",
    countries: ["US", "CA", "MX"],
    description: "United States, Canada, and Mexico",
    estimatedDays: "3-7 business days",
    icon: MapPin,
  },
  {
    name: "Europe",
    countries: ["GB", "DE", "FR", "IT", "ES", "NL", "BE", "AT", "CH", "SE", "NO", "DK", "FI"],
    description: "Major European countries",
    estimatedDays: "7-14 business days",
    icon: Globe,
  },
  {
    name: "Asia Pacific",
    countries: ["JP", "KR", "AU", "NZ", "SG", "HK", "TW"],
    description: "Japan, South Korea, Australia, New Zealand, and more",
    estimatedDays: "10-21 business days",
    icon: Globe,
  },
  {
    name: "Rest of World",
    countries: ["*"],
    description: "All other countries not covered above",
    estimatedDays: "14-28 business days",
    icon: Globe,
  },
];

const setupSteps = [
  {
    step: 1,
    title: "Create Your First Shipping Option",
    description: "Set up your basic shipping configuration",
    details: [
      "Navigate to your seller dashboard",
      "Go to Settings → Shipping Options",
      "Click 'Create New Option'",
      "Name your option (e.g., 'Standard Shipping')",
      "Set your country of origin",
    ],
    tips: [
      "Choose a descriptive name that reflects your shipping service",
      "Your country of origin affects customs and import duties",
      "You can create multiple options for different product types",
    ],
    estimatedTime: "10 minutes",
  },
  {
    step: 2,
    title: "Configure Shipping Zones",
    description: "Set up rates for different geographic regions",
    details: [
      "Add shipping zones (North America, Europe, etc.)",
      "Set base shipping rates for each zone",
      "Configure estimated delivery times",
      "Add additional item charges if needed",
    ],
    tips: [
      "Start with your most common destinations",
      "Research actual shipping costs before setting rates",
      "Consider offering free shipping for domestic orders",
      "Factor in packaging materials and handling time",
    ],
    estimatedTime: "20 minutes",
  },
  {
    step: 3,
    title: "Set Up Service Levels",
    description: "Offer different shipping options to customers",
    details: [
      "Create standard shipping option",
      "Add express shipping (optional)",
      "Set up free shipping thresholds",
      "Configure processing times",
    ],
    tips: [
      "Standard shipping is usually sufficient for most items",
      "Express shipping can increase conversion rates",
      "Free shipping thresholds encourage larger orders",
      "Be realistic about processing times",
    ],
    estimatedTime: "15 minutes",
  },
  {
    step: 4,
    title: "Apply to Products",
    description: "Assign shipping options to your products",
    details: [
      "Go to your product listings",
      "Select the shipping option for each product",
      "Verify shipping costs display correctly",
      "Test the checkout process",
    ],
    tips: [
      "Different products may need different shipping options",
      "Heavy or fragile items may require special handling",
      "Digital products don't need shipping options",
      "Regularly review and update your shipping rates",
    ],
    estimatedTime: "15 minutes",
  },
];

const shippingElements = [
  {
    title: "Shipping Zones",
    description: "Geographic regions with specific rates and delivery times",
    importance: "Critical",
    tips: [
      "Start with your most common destinations",
      "Research actual shipping costs for each zone",
      "Consider customs and import duties for international zones",
      "Set realistic delivery time expectations",
    ],
    icon: Globe,
  },
  {
    title: "Shipping Rates",
    description: "Costs charged to customers for shipping",
    importance: "Critical",
    tips: [
      "Factor in packaging materials and handling costs",
      "Stay competitive with similar products",
      "Consider offering free shipping thresholds",
      "Account for additional item charges",
    ],
    icon: DollarSign,
  },
  {
    title: "Processing Times",
    description: "Time needed to prepare and ship orders",
    importance: "High",
    tips: [
      "Be realistic about your actual capabilities",
      "Include time for packaging and labeling",
      "Consider your production schedule for custom items",
      "Communicate any delays promptly",
    ],
    icon: Clock,
  },
  {
    title: "Service Levels",
    description: "Different shipping options (standard, express, etc.)",
    importance: "Medium",
    tips: [
      "Standard shipping is sufficient for most items",
      "Express shipping can increase conversion rates",
      "Consider your product type and customer expectations",
      "Price express options competitively",
    ],
    icon: Truck,
  },
];

const optimizationTips = [
  {
    category: "Competitive Pricing",
    tips: [
      "Research shipping rates on similar products",
      "Consider offering free shipping on orders over a certain amount",
      "Factor in your actual costs plus a small markup",
      "Stay competitive while covering your expenses",
    ],
  },
  {
    category: "Clear Communication",
    tips: [
      "Be realistic about processing and shipping times",
      "Communicate any delays promptly",
      "Provide tracking information when available",
      "Set clear expectations in your shop policies",
    ],
  },
  {
    category: "International Shipping",
    tips: [
      "Research customs requirements for your target countries",
      "Consider using shipping services that handle customs",
      "Be transparent about potential import duties",
      "Start with major markets before expanding globally",
    ],
  },
  {
    category: "Packaging Considerations",
    tips: [
      "Use sturdy packaging that protects your items",
      "Consider eco-friendly packaging options",
      "Include care instructions for delicate items",
      "Factor packaging costs into your shipping rates",
    ],
  },
];

const commonIssues = [
  {
    issue: "Shipping rates not displaying",
    description: "Customers can't see shipping costs during checkout",
    solution: "Ensure your shipping option is assigned to products and the option is active",
  },
  {
    issue: "International shipping not working",
    description: "International customers can't complete purchases",
    solution: "Check that you've configured international zones and rates in your shipping option",
  },
  {
    issue: "Free shipping not applying",
    description: "Free shipping threshold isn't working correctly",
    solution: "Verify your free shipping threshold is set correctly and the order meets the minimum amount",
  },
  {
    issue: "Processing times too long",
    description: "Customers are surprised by long processing times",
    solution: "Update your processing times in the shipping option settings to reflect your actual capabilities",
  },
];

export default function ShippingOptionsPage() {
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
          <span>Shipping Options</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900">
          Shipping Options Guide
        </h1>
        <p className="text-lg text-gray-600">
          Complete guide to setting up shipping options and rates to get your handmade products 
          to customers worldwide. Configure domestic and international shipping options that work for your business.
        </p>
      </div>

      {/* Overview Alert */}
      <Alert className="border-purple-200 bg-purple-50">
        <Info className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-800">
          <strong>Shipping Setup Timeline:</strong> Plan for 1-2 hours to complete your initial 
          shipping options setup. You can always adjust rates and zones as your business grows.
        </AlertDescription>
      </Alert>

      {/* Shipping Elements Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">
          Essential Shipping Elements
        </h2>
        <p className="text-gray-600">
          Your shipping options consist of several key elements that work together to provide 
          customers with accurate shipping costs and delivery expectations:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shippingElements.map((element) => (
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
          Shipping Setup Process
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

      {/* Shipping Zones */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Shipping Zones</h2>
        <p className="text-gray-600">
          Shipping zones help you organize your shipping rates by geographic regions. 
          Here are the recommended zones for most sellers:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shippingZones.map((zone) => (
            <div
              key={zone.name}
              className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <zone.icon className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">{zone.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{zone.description}</p>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>Estimated delivery: {zone.estimatedDays}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <MapPin className="h-3 w-3" />
                      <span>Countries: {zone.countries.length > 1 ? `${zone.countries.length} countries` : zone.countries[0]}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optimization Tips */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">
          Shipping Optimization Tips
        </h2>
        <p className="text-gray-600">
          These strategies will help you create shipping options that work for your business 
          and provide excellent customer experience:
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

      {/* Common Issues */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">
          Common Shipping Issues & Solutions
        </h2>
        <p className="text-gray-600">
          Troubleshoot these common shipping problems that sellers encounter:
        </p>

        <div className="space-y-4">
          {commonIssues.map((issue) => (
            <div
              key={issue.issue}
              className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900">
                    {issue.issue}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {issue.description}
                  </p>
                  <p className="text-sm text-purple-600 mt-2">
                    <strong>Solution:</strong> {issue.solution}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Important Notes */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
                     <strong>Important:</strong> Shipping options are essential for physical products. 
           Digital products don&apos;t require shipping options. Make sure to test your shipping 
           configuration before going live with your products.
        </AlertDescription>
      </Alert>

      {/* Related Articles */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Related Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/help-center/shop-setup"
            className="group block p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Settings className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 group-hover:text-purple-600 transition-colors">
                  Setting Up Your Shop
                </h3>
                <p className="text-sm text-gray-600">Complete shop configuration guide</p>
              </div>
            </div>
          </Link>
          
          <Link
            href="/help-center/create-product"
            className="group block p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 group-hover:text-purple-600 transition-colors">
                  Creating Your First Product
                </h3>
                <p className="text-sm text-gray-600">Step-by-step product listing guide</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold">Need Help with Shipping?</h3>
          <p className="text-purple-100">
            Having trouble setting up your shipping options? Our support team is here to help.
          </p>
          <div className="flex justify-center">
            <Button variant="secondary" size="lg">
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

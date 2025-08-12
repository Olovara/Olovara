import { Metadata } from "next"
import Link from "next/link"
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  FileText, 
  Camera, 
  Shield,
  ArrowLeft,
  ArrowRight,
  Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export const metadata: Metadata = {
  title: "Seller Application Process | Help Center | Yarnnu",
  description: "Complete step-by-step guide to applying as a seller on Yarnnu. Learn about requirements, verification, and approval process.",
}

const applicationSteps = [
  {
    step: 1,
    title: "Create Your Account",
    description: "Start by creating a Yarnnu account if you don't have one already",
    details: [
      "Sign up with your email address",
      "Verify your email through the confirmation link",
      "Complete your basic profile information",
      "Choose a secure password"
    ],
    tips: [
      "Use a professional email address that you check regularly",
      "Keep your password secure and unique to Yarnnu",
      "Complete your profile with accurate information"
    ],
    estimatedTime: "5 minutes"
  },
  {
    step: 2,
    title: "Submit Seller Application",
    description: "Fill out the comprehensive seller application form",
    details: [
      "Provide your business information",
      "Describe your handmade products",
      "Share your crafting experience",
      "Explain your business goals"
    ],
    tips: [
      "Be detailed and honest in your responses",
      "Include specific examples of your work",
      "Demonstrate your passion for handmade crafts",
      "Show understanding of Yarnnu's handmade-only policy"
    ],
    estimatedTime: "15-20 minutes"
  },
  {
    step: 3,
    title: "Upload Required Documents",
    description: "Submit necessary documentation for verification",
    details: [
      "Government-issued photo ID",
      "Proof of address (utility bill, bank statement)",
      "Business registration (if applicable)",
      "Tax identification information"
    ],
    tips: [
      "Ensure documents are clear and legible",
      "Documents must be current (within 3 months)",
      "Black out sensitive information not required",
      "Use high-quality scans or photos"
    ],
    estimatedTime: "10 minutes"
  },
  {
    step: 4,
    title: "Product Portfolio Review",
    description: "Showcase your handmade products for review",
    details: [
      "Upload 5-10 high-quality product photos",
      "Include work-in-progress shots",
      "Show your workspace and tools",
      "Provide product descriptions"
    ],
    tips: [
      "Use natural lighting for best photo quality",
      "Show the handmade nature of your work",
      "Include close-ups of craftsmanship details",
      "Demonstrate variety in your product range"
    ],
    estimatedTime: "30 minutes"
  },
  {
    step: 5,
    title: "Application Review",
    description: "Our team reviews your application thoroughly",
    details: [
      "Verification of submitted documents",
      "Review of product portfolio",
      "Assessment of handmade compliance",
      "Background checks (if required)"
    ],
    tips: [
      "Review process typically takes 3-5 business days",
      "You'll receive email updates on your application status",
      "Be patient during the review period",
      "Ensure all contact information is current"
    ],
    estimatedTime: "3-5 business days"
  },
  {
    step: 6,
    title: "Approval & Onboarding",
    description: "Complete final setup steps after approval",
    details: [
      "Receive approval notification",
      "Complete Stripe Connect setup",
      "Set up your shop profile",
      "Create your first product listing"
    ],
    tips: [
      "Follow the onboarding checklist carefully",
      "Set up payment processing immediately",
      "Customize your shop to reflect your brand",
      "Start with a few high-quality products"
    ],
    estimatedTime: "1-2 hours"
  }
]

const requirements = [
  {
    title: "Age Requirement",
    description: "Must be 18 years or older",
    icon: Shield
  },
  {
    title: "Handmade Products Only",
    description: "All products must be handmade by you",
    icon: CheckCircle
  },
  {
    title: "Valid Documentation",
    description: "Government ID and proof of address required",
    icon: FileText
  },
  {
    title: "Quality Standards",
    description: "Products must meet our quality guidelines",
    icon: CheckCircle
  },
  {
    title: "Business Compliance",
    description: "Must comply with local business regulations",
    icon: Shield
  },
  {
    title: "Active Participation",
    description: "Commitment to maintaining an active shop",
    icon: CheckCircle
  }
]

const commonReasons = [
  {
    reason: "Incomplete Application",
    description: "Missing required information or documents",
    solution: "Double-check all fields and ensure all documents are uploaded"
  },
  {
    reason: "Non-Handmade Products",
    description: "Products appear to be mass-produced or resold",
    solution: "Ensure all products are genuinely handmade by you"
  },
  {
    reason: "Poor Quality Photos",
    description: "Product photos don't clearly show handmade nature",
    solution: "Take clear, well-lit photos that showcase your craftsmanship"
  },
  {
    reason: "Insufficient Documentation",
    description: "Missing or unclear verification documents",
    solution: "Provide clear, current documents as specified"
  },
  {
    reason: "Policy Violations",
    description: "Application violates Yarnnu's terms or policies",
    solution: "Review and comply with all platform policies"
  }
]

export default function SellerApplicationPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Link href="/help-center" className="hover:text-blue-600">
            Help Center
          </Link>
          <span>/</span>
          <span>Seller Application Process</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900">
          Seller Application Process
        </h1>
        <p className="text-lg text-gray-600">
          Complete step-by-step guide to becoming a seller on Yarnnu. Learn about requirements, the application process, and what to expect.
        </p>
      </div>

      {/* Overview Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Application Timeline:</strong> The complete process typically takes 3-5 business days from submission to approval. 
          Make sure you have all required documents ready before starting.
        </AlertDescription>
      </Alert>

      {/* Requirements Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Requirements</h2>
        <p className="text-gray-600">
          Before applying, ensure you meet all the following requirements:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requirements.map((req) => (
            <div key={req.title} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              <req.icon className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">{req.title}</h3>
                <p className="text-sm text-gray-600">{req.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Application Steps */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Application Steps</h2>
        
        {applicationSteps.map((step, index) => (
          <div key={step.step} className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                {step.step}
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
                  <p className="text-gray-600 mt-1">{step.description}</p>
                  <div className="flex items-center space-x-2 mt-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>Estimated time: {step.estimatedTime}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">What you&apos;ll do:</h4>
                    <ul className="space-y-1">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-start space-x-2 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Pro Tips:</h4>
                    <ul className="space-y-1">
                      {step.tips.map((tip, tipIndex) => (
                        <li key={tipIndex} className="flex items-start space-x-2 text-sm text-gray-600">
                          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
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

      {/* Common Rejection Reasons */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Common Application Issues</h2>
        <p className="text-gray-600">
          Understanding these common issues can help you avoid delays in your application:
        </p>
        
        <div className="space-y-4">
          {commonReasons.map((reason) => (
            <div key={reason.reason} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{reason.reason}</h3>
                  <p className="text-sm text-gray-600 mt-1">{reason.description}</p>
                  <p className="text-sm text-blue-600 mt-2">
                    <strong>Solution:</strong> {reason.solution}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Ready to Apply?</h2>
        <p className="text-gray-600 mb-4">
          Now that you understand the process, you&apos;re ready to start your seller application. 
          Make sure you have all required documents and photos ready before beginning.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild>
            <Link href="/seller-application">
              Start Application
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/help-center/shop-setup">
              Next: Setting Up Your Shop →
            </Link>
          </Button>
        </div>
      </div>

      {/* Related Articles */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Related Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link 
            href="/help-center/shop-setup"
            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <h3 className="font-medium text-gray-900">Setting Up Your Shop</h3>
            <p className="text-sm text-gray-600 mt-1">Learn how to create and customize your shop profile</p>
          </Link>
          <Link 
            href="/help-center/stripe-setup"
            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <h3 className="font-medium text-gray-900">Stripe Connect Setup</h3>
            <p className="text-sm text-gray-600 mt-1">Secure payment processing setup for your shop</p>
          </Link>
        </div>
      </div>
    </div>
  )
} 
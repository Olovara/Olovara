"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Sparkles,
  Store,
  Package,
  CreditCard,
  CheckCircle,
  ArrowRight,
  Heart,
  Users,
  Globe,
  Shield,
  Circle,
} from "lucide-react";
import { getUserFirstName } from "@/actions/onboardingActions";

// Simplified onboarding steps for timeline
const timelineSteps = [
  {
    id: "setup",
    title: "Personalize Your Shop",
    description:
      "Choose your preferences, name your shop, and set your location",
    icon: Store,
    color: "bg-purple-100 text-purple-600",
    borderColor: "border-purple-200",
  },
  {
    id: "create",
    title: "Create Your First Product",
    description: "List your handmade item with photos and details",
    icon: Package,
    color: "bg-purple-100 text-purple-600",
    borderColor: "border-purple-200",
  },
  {
    id: "payment",
    title: "Get Paid",
    description: "Connect your payment account and start receiving money",
    icon: CreditCard,
    color: "bg-purple-100 text-purple-600",
    borderColor: "border-purple-200",
  },
  {
    id: "success",
    title: "Get After Your First Sale",
    description:
      "We'll help you with tips, advice, and resources to help you make your first sale",
    icon: Heart,
    color: "bg-purple-100 text-purple-600",
    borderColor: "border-purple-200",
  },
];

// Key benefits of selling on OLOVARA
const benefits = [
  {
    icon: Users,
    title: "Supportive Community",
    description: "Join a community of passionate handmade sellers", //TODO: Add number once people start selling eg. Join thousands of passionate ...
  },
  {
    icon: Globe,
    title: "Global Reach",
    description: "Sell to customers worldwide",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description: "Safe and reliable payment processing",
  },
  {
    icon: Heart,
    title: "Handmade Focus",
    description: "Dedicated platform for authentic handmade goods",
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState<string | null>(null);

  // Get user's first name for personalization
  useEffect(() => {
    const fetchFirstName = async () => {
      try {
        const result = await getUserFirstName();
        if (result.firstName) {
          setFirstName(result.firstName);
        }
      } catch (error) {
        console.error("Error fetching first name:", error);
      }
    };

    fetchFirstName();
  }, []);

  const handleGetStarted = () => {
    router.push("/onboarding/help-preferences");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl mx-auto"
      >
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-center justify-center mb-6"
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                {firstName ? `Welcome, ${firstName}!` : "Welcome to OLOVARA!"}
              </CardTitle>

              <CardDescription className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                {firstName
                  ? `Thanks for choosing OLOVARA! We're excited to help you start your handmade business journey, ${firstName}! Let's get you set up in just a few simple steps. Ready to bring your vison to life?`
                  : "Thanks for choosing OLOVARA! We're excited to help you start your handmade business journey! Let's get you set up in just a few simple steps. Ready to bring your vison to life?"}
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Vertical Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-semibold text-center text-gray-800 mb-8">
                Here&apos;s what we&apos;ll do together:
              </h3>

              <div className="grid grid-cols-[auto_1fr] gap-x-6">
                {timelineSteps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.2, duration: 0.5 }}
                    className="contents"
                  >
                    {/* Icon Column: Changed to a vertical flex container */}
                    <div className="relative flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center z-10">
                        <div
                          className={`w-12 h-12 rounded-full ${step.color} flex items-center justify-center`}
                        >
                          <step.icon className="h-6 w-6" />
                        </div>
                      </div>

                      {/* Connecting Line: Now uses flex-grow to fill space */}
                      {index < timelineSteps.length - 1 && (
                        <div className="w-1 flex-grow bg-purple-200"></div>
                      )}
                    </div>

                    {/* Content Column: Added padding-bottom to create space */}
                    <div className="pt-2 pb-8">
                      <div
                        className={`p-6 rounded-xl border-2 ${step.borderColor} bg-white/80 shadow-sm hover:shadow-md transition-all duration-200`}
                      >
                        <h4 className="font-bold text-gray-900 text-lg mb-2">
                          {step.title}
                        </h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Benefits Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200"
            >
              <h3 className="text-xl font-semibold text-center text-gray-800 mb-6">
                Why sell on OLOVARA?
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.4 + index * 0.1, duration: 0.5 }}
                    className="flex items-center space-x-3"
                  >
                    <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                      <benefit.icon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">
                        {benefit.title}
                      </h4>
                      <p className="text-gray-600 text-xs mt-1">
                        {benefit.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Success Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.5 }}
              className="flex items-center justify-center space-x-6 text-sm text-gray-600"
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span>Easy Setup</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span>Start selling today</span>
              </div>
            </motion.div>

            {/* Get Started Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.5 }}
              className="flex justify-center pt-4"
            >
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Let&apos;s Get Started!
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

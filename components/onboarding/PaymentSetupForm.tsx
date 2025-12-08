"use client";

import { useState } from "react";
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
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Shield,
  CheckCircle,
  Sparkles,
  Lightbulb,
  Zap,
} from "lucide-react";

import { toast } from "sonner";
import { StepIndicator } from "@/components/onboarding/StepIndicator";

export default function PaymentSetupForm() {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const handleConnectStripe = async () => {
    setIsConnecting(true);

    try {
      // Use the same API route as the billing page
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create Stripe account link');
      }

      const result = await response.json();

      if (result.success && result.url) {
        // Redirect to Stripe onboarding
        window.location.href = result.url;
      } else {
        throw new Error('No Stripe account link received');
      }
    } catch (error) {
      console.error("Error connecting Stripe:", error);
      toast.error(error instanceof Error ? error.message : "Failed to connect Stripe account");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleContinue = async () => {
    // Clear permissions cache before redirecting
    if (typeof window !== 'undefined') {
      localStorage.removeItem('yarnnu_user_permissions');
      localStorage.removeItem('yarnnu_user_role');
      localStorage.removeItem('yarnnu_permissions_timestamp');
    }
    // Force a full page reload to ensure fresh permissions
    window.location.href = "/seller/dashboard";
  };

  const handleBack = () => {
    router.push("/onboarding/create-first-product");
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    
    try {
      // Clear permissions cache
      if (typeof window !== 'undefined') {
        localStorage.removeItem('yarnnu_user_permissions');
        localStorage.removeItem('yarnnu_user_role');
        localStorage.removeItem('yarnnu_permissions_timestamp');
      }
      
      // Call clear-cache API to ensure server-side cache is cleared
      try {
        await fetch('/api/auth/clear-cache', { method: 'POST' });
      } catch (error) {
        console.error('Error clearing cache:', error);
        // Continue anyway - client cache is cleared
      }
      
      // Force a full page reload to ensure fresh permissions are fetched
      window.location.href = "/seller/dashboard";
    } catch (error) {
      console.error('Error skipping payment setup:', error);
      toast.error('Failed to skip payment setup');
      setIsSkipping(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Step Indicator */}
      <div className="w-full max-w-4xl mx-auto">
        <StepIndicator currentStep="payment-setup" className="mb-8" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl mx-auto"
      >
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              How You&apos;ll Get Paid
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect your Stripe account to start receiving payments for your
              sales. It&apos;s secure, fast, and trusted by millions of sellers
              worldwide.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Security Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                <Shield className="h-6 w-6 text-purple-600" />
                <div>
                  <h4 className="font-semibold text-purple-800">Secure</h4>
                  <p className="text-sm text-purple-700">Bank-level security</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                <Zap className="h-6 w-6 text-purple-600" />
                <div>
                  <h4 className="font-semibold text-purple-800">Fast</h4>
                  <p className="text-sm text-purple-700">Instant transfers</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                <Sparkles className="h-6 w-6 text-purple-600" />
                <div>
                  <h4 className="font-semibold text-purple-800">Reliable</h4>
                  <p className="text-sm text-purple-700">99.9% uptime</p>
                </div>
              </div>
            </div>

            {/* Connection Status */}
            {isConnected ? (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <CheckCircle className="h-6 w-6" />
                  <span className="font-semibold">Stripe Account Connected!</span>
                </div>
                <p className="text-gray-600">
                  Your payment account is ready. You can now receive payments for your sales.
                </p>
                <Button
                  onClick={handleContinue}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Continue to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* What You&apos;ll Need */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2 text-purple-600" />
                    What You&apos;ll Need
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-purple-600 mr-2" />
                      Government-issued ID (driver&apos;s license, passport, etc.)
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-purple-600 mr-2" />
                      Bank account information
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-purple-600 mr-2" />
                      Business information (if applicable)
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-purple-600 mr-2" />
                      Social Security Number (US) or Tax ID
                    </li>
                  </ul>
                </div>

                {/* Connect Button */}
                <div className="text-center space-y-4">
                  <Button
                    onClick={handleConnectStripe}
                    disabled={isConnecting}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConnecting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Connecting...
                      </>
                    ) : (
                      <>
                        Connect Stripe Account
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                  
                  <p className="text-sm text-gray-500">
                    You&apos;ll be redirected to Stripe to complete the setup
                  </p>
                </div>

                {/* Skip Option */}
                <div className="text-center">
                  <Button
                    onClick={handleSkip}
                    disabled={isSkipping}
                    variant="ghost"
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {isSkipping ? "Loading..." : "Skip for now"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between items-center w-full max-w-4xl mx-auto">
        <Button
          onClick={handleBack}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
      </div>
    </div>
  );
}

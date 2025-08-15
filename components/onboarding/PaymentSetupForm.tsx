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

import { setupStripeAccount } from "@/actions/onboardingActions";
import { toast } from "sonner";

export default function PaymentSetupForm() {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);



  const handleConnectStripe = async () => {
    setIsConnecting(true);

    try {
      // This would typically redirect to Stripe Connect onboarding
      const result = await setupStripeAccount();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Simulate successful connection
      setTimeout(() => {
        setIsConnected(true);
        toast.success("Stripe account connected successfully!");
      }, 2000);
    } catch (error) {
      console.error("Error connecting Stripe:", error);
      toast.error("Failed to connect Stripe account");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleContinue = () => {
    router.push("/seller/dashboard");
  };

  const handleBack = () => {
    router.push("/onboarding/create-first-product");
  };

  const handleSkip = () => {
    router.push("/seller/dashboard");
  };

  return (
    <div className="space-y-8">


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
            {/* Stripe Connection Status */}
            {!isConnected ? (
              <div className="space-y-6">
                {/* Stripe Benefits */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Why Stripe?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-purple-900">
                          Secure Payments
                        </p>
                        <p className="text-sm text-purple-700">
                          Bank-level security for all transactions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-purple-900">
                          Fast Transfers
                        </p>
                        <p className="text-sm text-purple-700">
                          Money in your bank account within 2-3 days
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-purple-900">
                          Global Support
                        </p>
                        <p className="text-sm text-purple-700">
                          Accept payments from customers worldwide
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-purple-900">
                          Easy Setup
                        </p>
                        <p className="text-sm text-purple-700">
                          Connect in just a few minutes
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* What You'll Need */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    What You&apos;ll Need
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-blue-800">
                        Government-issued ID (driver&apos;s license, passport)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-blue-800">
                        Social Security Number (US) or Tax ID
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-blue-800">
                        Bank account information
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-blue-800">
                        Business information (if applicable)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Connect Button */}
                <div className="text-center">
                  <Button
                    onClick={handleConnectStripe}
                    disabled={isConnecting}
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg"
                  >
                    {isConnecting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Connecting...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Connect Stripe Account
                      </div>
                    )}
                  </Button>
                  <p className="text-sm text-gray-500 mt-3">
                    You&apos;ll be redirected to Stripe to complete the setup
                  </p>
                </div>
              </div>
            ) : (
              /* Success State */
              <div className="text-center space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 bg-green-500 rounded-full">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-green-900 mb-2">
                    Payment Setup Complete!
                  </h3>
                  <p className="text-green-700">
                    Your Stripe account is connected and ready to receive
                    payments.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    What&apos;s Next?
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1 text-left">
                    <li>• Start receiving payments for your sales</li>
                    <li>• View your earnings in your dashboard</li>
                    <li>• Set up automatic transfers to your bank</li>
                    <li>• Access detailed payment reports</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Skip for now
                </Button>

                {isConnected && (
                  <Button
                    onClick={handleContinue}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-2"
                  >
                    Continue to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

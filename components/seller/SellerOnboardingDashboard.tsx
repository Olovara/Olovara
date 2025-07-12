"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, AlertCircle, ArrowRight, ExternalLink, RefreshCw } from "lucide-react";
import { useSellerOnboardingAPI } from "@/hooks/use-seller-onboarding-api";
import { OnboardingSurveyProvider } from "@/components/providers/OnboardingSurveyProvider";
import Link from "next/link";

const SellerOnboardingDashboard = () => {
  const { status: onboardingData, loading, error, refresh } = useSellerOnboardingAPI();

  const handleRefreshStatus = async () => {
    await refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !onboardingData) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Onboarding Data</h3>
        <p className="text-muted-foreground">Please refresh the page and try again.</p>
      </div>
    );
  }

  const getStepStatus = (stepId: string) => {
    switch (stepId) {
      case 'application_submitted':
        return 'completed';
      case 'application_approved':
        return onboardingData.applicationAccepted ? 'completed' : 'pending';
      case 'profile_completed':
        return onboardingData.shopProfileComplete ? 'completed' : 'pending';
      case 'stripe_connected':
        return onboardingData.stripeConnected ? 'completed' : 'pending';
      case 'shipping_profile_created':
        return onboardingData.shippingProfileCreated ? 'completed' : 'pending';
      case 'fully_activated':
        return onboardingData.isFullyActivated ? 'completed' : 'pending';
      default:
        return 'pending';
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Circle className="h-5 w-5 text-gray-400" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepAction = (stepId: string) => {
    const status = getStepStatus(stepId);
    
    if (status === 'completed') {
      return null;
    }

    switch (stepId) {
      case 'application_approved':
        if (!onboardingData.applicationAccepted) {
          return (
            <div className="text-sm text-muted-foreground">
              Your application is under review. We&apos;ll notify you once it&apos;s approved.
            </div>
          );
        }
        break;
      case 'profile_completed':
        return (
          <Button asChild size="sm" className="mt-2">
            <Link href="/seller/dashboard/settings">
              Complete Profile
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        );
      case 'stripe_connected':
        if (!onboardingData.shopProfileComplete) {
          return (
            <div className="text-sm text-muted-foreground">
              Complete your profile first to connect Stripe.
            </div>
          );
        }
        return (
          <Button asChild size="sm" className="mt-2">
            <Link href="/seller/dashboard/billing">
              Connect Stripe
              <ExternalLink className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        );
      case 'shipping_profile_created':
        if (!onboardingData.stripeConnected) {
          return (
            <div className="text-sm text-muted-foreground">
              Connect your Stripe account first to create shipping profiles.
            </div>
          );
        }
        return (
          <Button asChild size="sm" className="mt-2">
            <Link href="/seller/dashboard/settings/shipping">
              Create Shipping Profile
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        );
      case 'fully_activated':
        if (!onboardingData.shippingProfileCreated) {
          return (
            <div className="text-sm text-muted-foreground">
              Create a shipping profile to fully activate your account.
            </div>
          );
        }
        return (
          <Button asChild size="sm" className="mt-2">
            <Link href="/seller/dashboard/products">
              Start Creating Products
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        );
    }
  };

  // Define onboarding steps
  const onboardingSteps = [
    {
      id: 'application_submitted',
      title: 'Application Submitted',
      description: 'Your seller application has been submitted and is under review.',
    },
    {
      id: 'application_approved',
      title: 'Application Approved',
      description: 'Your seller application has been approved! Complete the setup steps below.',
    },
    {
      id: 'profile_completed',
      title: 'Complete Your Profile',
      description: 'Fill out your business information and tax details.',
    },
    {
      id: 'stripe_connected',
      title: 'Connect Stripe Account',
      description: 'Connect your Stripe account to receive payments.',
    },
    {
      id: 'shipping_profile_created',
      title: 'Create Shipping Profile',
      description: 'Set up your shipping rates and policies.',
    },
    {
      id: 'fully_activated',
      title: 'Ready to Sell!',
      description: 'Your seller account is fully activated. You can now create and sell products.',
    },
  ];

  return (
    <OnboardingSurveyProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-3xl font-bold">Welcome to Your Seller Dashboard</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshStatus}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Status
            </Button>
          </div>
          <p className="text-muted-foreground mb-4">
            Complete these steps to fully activate your seller account and start selling.
          </p>
          
          {/* Progress Bar */}
          <div className="max-w-md mx-auto mb-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Setup Progress</span>
              <span>{onboardingData.completionPercentage}% Complete</span>
            </div>
            <Progress value={onboardingData.completionPercentage} className="h-2" />
          </div>
        </div>

        {/* Onboarding Steps */}
        <div className="grid gap-4">
          {onboardingSteps.map((step) => {
            const status = getStepStatus(step.id);
            const isActive = status === 'pending' && 
              (step.id === onboardingData.currentStep || 
               (step.id === 'application_approved' && !onboardingData.applicationAccepted) ||
               (step.id === 'profile_completed' && onboardingData.applicationAccepted && !onboardingData.shopProfileComplete) ||
               (step.id === 'stripe_connected' && onboardingData.shopProfileComplete && !onboardingData.stripeConnected) ||
               (step.id === 'shipping_profile_created' && onboardingData.stripeConnected && !onboardingData.shippingProfileCreated) ||
               (step.id === 'fully_activated' && onboardingData.shippingProfileCreated));

            return (
              <Card key={step.id} className={`transition-all duration-200 ${isActive ? 'ring-2 ring-purple-500 bg-purple-50' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStepIcon(status)}
                      <div>
                        <CardTitle className="text-lg">{step.title}</CardTitle>
                        <CardDescription>{step.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {status === 'completed' && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Completed
                        </Badge>
                      )}
                      {isActive && (
                        <Badge variant="default" className="bg-purple-100 text-purple-800">
                          Current Step
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {getStepAction(step.id)}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        {onboardingData.completionPercentage === 100 && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Congratulations! Your seller account is fully activated.
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href="/seller/dashboard/products/create-product">
                    Create Your First Product
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/seller/dashboard">
                    View Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </OnboardingSurveyProvider>
  );
};

export default SellerOnboardingDashboard; 
"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Circle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useOnboarding } from "@/hooks/use-onboarding";
import { OnboardingSurveyProvider } from "@/components/providers/OnboardingSurveyProvider";
import { usePermissions } from "@/components/providers/PermissionProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Spinner from "../spinner";

const SellerOnboardingDashboard = () => {
  const {
    steps,
    progress,
    nextStep,
    isFullyActivated,
    isLoading,
    isRefreshing,
    refreshSteps,
  } = useOnboarding();
  const { refreshPermissions } = usePermissions();
  const router = useRouter();

  const handleRefreshStatus = async () => {
    // Also refresh permissions when refreshing onboarding status
    await Promise.all([
      refreshSteps(),
      refreshPermissions()
    ]);
  };

  // Handle navigation to dashboard with cache clearing
  const handleGoToDashboard = async () => {
    // Clear permission cache to force fresh role fetch
    if (typeof window !== 'undefined') {
      localStorage.removeItem('olovara_user_permissions');
      localStorage.removeItem('olovara_user_role');
      localStorage.removeItem('olovara_permissions_timestamp');
    }
    // Refresh permissions to get latest role
    await refreshPermissions();
    // Navigate to dashboard
    router.push("/seller/dashboard");
    // Force a page reload to ensure fresh data
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
      </div>
    );
  }

  if (!steps || steps.length === 0) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          Error Loading Onboarding Data
        </h3>
        <p className="text-muted-foreground">
          Please refresh the page and try again.
        </p>
      </div>
    );
  }

  // Define onboarding steps
  const onboardingSteps = [
    {
      id: "application_submitted",
      title: "Application Submitted",
      description:
        "Your seller application has been submitted and is under review.",
    },
    {
      id: "application_approved",
      title: "Application Approved",
      description:
        "Your seller application has been approved! Complete the setup steps below.",
    },
    {
      id: "shop_preferences",
      title: "Shop Setup",
      description: "Choose your country, currency, and shop preferences.",
    },
    {
      id: "shop_naming",
      title: "Shop Name",
      description: "Choose a unique name for your handmade shop.",
    },
    {
      id: "handmade_verification",
      title: "Handmade Verification",
      description: "Upload photos of your products and workspace to verify you create handmade items.",
    },
    {
      id: "payment_setup",
      title: "Get Paid",
      description: "Connect your payment account to start receiving money.",
    },
    {
      id: "gpsr_compliance",
      title: "EU Compliance (Optional)",
      description: "Complete GPSR compliance to sell to EU/EEA countries.",
    },
    {
      id: "fully_activated",
      title: "Ready to Sell!",
      description: "Your shop is set up and ready to start selling.",
    },
  ];

  const getStepStatus = (stepId: string) => {
    const step = steps.find((s) => s.stepKey === stepId);
    return step?.completed ? "completed" : "pending";
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "pending":
        return <Circle className="h-5 w-5 text-gray-400" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepAction = (stepId: string) => {
    const status = getStepStatus(stepId);

    if (status === "completed") {
      return null;
    }

    switch (stepId) {
      case "application_approved":
        const applicationSubmitted = steps.find(
          (s) => s.stepKey === "application_submitted"
        )?.completed;
        if (!applicationSubmitted) {
          return (
            <div className="text-sm text-muted-foreground">
              Your application is under review. We&apos;ll notify you once
              it&apos;s approved.
            </div>
          );
        }
        break;
      case "shop_preferences":
        return (
          <Button asChild size="sm" className="mt-2">
            <Link href="/seller/dashboard/settings?tab=preferences">
              Set Up Shop
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        );
      case "shop_naming":
        const shopPreferencesCompleted = steps.find(
          (s) => s.stepKey === "shop_preferences"
        )?.completed;
        if (!shopPreferencesCompleted) {
          return (
            <div className="text-sm text-muted-foreground">
              Complete shop setup first to choose your shop name.
            </div>
          );
        }
        return (
          <Button asChild size="sm" className="mt-2">
            <Link href="/seller/dashboard/settings?tab=about">
              Choose Shop Name
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        );
      case "handmade_verification":
        const shopNamingCompleted = steps.find(
          (s) => s.stepKey === "shop_naming"
        )?.completed;
        if (!shopNamingCompleted) {
          return (
            <div className="text-sm text-muted-foreground">
              Complete shop naming first to verify your handmade products.
            </div>
          );
        }
        return (
          <Button asChild size="sm" className="mt-2">
            <Link href="/onboarding/handmade-verification">
              Upload Verification Photos
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        );
      case "payment_setup":
        const handmadeVerificationCompleted = steps.find(
          (s) => s.stepKey === "handmade_verification"
        )?.completed;
        if (!handmadeVerificationCompleted) {
          return (
            <div className="text-sm text-muted-foreground">
              Complete handmade verification first to set up payments.
            </div>
          );
        }
        return (
          <Button asChild size="sm" className="mt-2">
            <Link href="/seller/dashboard/billing">
              Set Up Payments
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        );
      case "gpsr_compliance":
        const gpsrPaymentSetupCompleted = steps.find(
          (s) => s.stepKey === "payment_setup"
        )?.completed;
        if (!gpsrPaymentSetupCompleted) {
          return (
            <div className="text-sm text-muted-foreground">
              Complete payment setup first to access EU compliance.
            </div>
          );
        }
        return (
          <div className="space-y-2">
            <Button asChild size="sm" className="mt-2">
              <Link href="/seller/dashboard/products/create-product">
                Add Product with EU Compliance
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <div className="text-xs text-muted-foreground">
              This step is optional unless you plan to sell to EU/EEA countries.
            </div>
          </div>
        );
      case "fully_activated":
        const fullyActivatedPaymentSetupCompleted = steps.find(
          (s) => s.stepKey === "payment_setup"
        )?.completed;
        if (!fullyActivatedPaymentSetupCompleted) {
          return (
            <div className="text-sm text-muted-foreground">
              Set up payments first to fully activate your account.
            </div>
          );
        }
        return (
          <Button size="sm" className="mt-2" onClick={handleGoToDashboard}>
            Go to Dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <OnboardingSurveyProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-3xl font-bold">
              Welcome to Your Seller Dashboard
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshStatus}
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
            </Button>
          </div>
          <p className="text-muted-foreground mb-4">
            Complete these steps to fully activate your seller account and start
            selling.
          </p>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto mb-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Setup Progress</span>
              <span>{progress}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Onboarding Steps */}
        <div className="grid gap-4">
          {onboardingSteps.map((step) => {
            const status = getStepStatus(step.id);
            const isActive =
              status === "pending" &&
              step.id !== "application_approved" && // Exclude application_approved from being highlighted
              (step.id === nextStep ||
                (step.id === "shop_preferences" &&
                  steps.find((s) => s.stepKey === "application_approved")
                    ?.completed &&
                  !steps.find((s) => s.stepKey === "shop_preferences")
                    ?.completed) ||
                (step.id === "shop_naming" &&
                  steps.find((s) => s.stepKey === "shop_preferences")
                    ?.completed &&
                  !steps.find((s) => s.stepKey === "shop_naming")?.completed) ||
                (step.id === "payment_setup" &&
                  steps.find((s) => s.stepKey === "shop_naming")?.completed &&
                  !steps.find((s) => s.stepKey === "payment_setup")
                    ?.completed) ||
                (step.id === "gpsr_compliance" &&
                  steps.find((s) => s.stepKey === "payment_setup")?.completed &&
                  !steps.find((s) => s.stepKey === "gpsr_compliance")?.completed) ||
                (step.id === "fully_activated" &&
                  steps.find((s) => s.stepKey === "payment_setup")?.completed));

            return (
              <Card
                key={step.id}
                className={`transition-all duration-200 ${isActive ? "ring-2 ring-purple-500 bg-purple-50" : ""}`}
              >
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
                      {status === "completed" && (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          Completed
                        </Badge>
                      )}
                      {status === "pending" &&
                        step.id === "application_approved" &&
                        !steps.find(
                          (s) => s.stepKey === "application_submitted"
                        )?.completed && (
                          <Badge
                            variant="secondary"
                            className="bg-yellow-100 text-yellow-800"
                          >
                            Pending
                          </Badge>
                        )}
                      {status === "pending" && step.id === "gpsr_compliance" && (
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800"
                        >
                          Optional
                        </Badge>
                      )}
                      {isActive && (
                        <Badge
                          variant="default"
                          className="bg-purple-100 text-purple-800"
                        >
                          Current Step
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>{getStepAction(step.id)}</CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        {progress === 100 && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Congratulations! Your handmade shop is fully set up.
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href="/seller/dashboard/products/create-product">
                    Create Another Product
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/seller/dashboard">View Dashboard</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/seller/dashboard/analytics">View Analytics</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        {progress < 100 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center">
                <Sparkles className="h-5 w-5 mr-2" />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-700 mb-3">
                We&apos;re here to help you succeed! Check out our resources for
                new sellers.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/help-center">Help Center</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/help-center/seller-application">
                    Seller Guide
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/help-center/shop-setup">Shop Setup Guide</Link>
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

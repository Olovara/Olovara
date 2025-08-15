import React from "react";
import { useOnboarding } from "@/hooks/use-onboarding";
import { CheckCircle, Circle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Step configuration - aligned with existing SellerOnboardingDashboard
const STEP_CONFIG: Record<string, { title: string; description: string }> = {
  application_submitted: {
    title: "Application Submitted",
    description: "Your seller application has been submitted and is under review."
  },
  application_approved: {
    title: "Application Approved",
    description: "Your seller application has been approved! Complete the setup steps below."
  },
  shop_preferences: {
    title: "Shop Setup",
    description: "Choose your country, currency, and shop preferences."
  },
  shop_naming: {
    title: "Shop Name",
    description: "Choose a unique name for your handmade shop."
  },
  payment_setup: {
    title: "Get Paid",
    description: "Connect your payment account to start receiving money."
  },
  gpsr_compliance: {
    title: "EU Product Safety",
    description: "Complete EU product safety information in your products and business address in shop settings."
  }
};

interface OnboardingProgressProps {
  showDetails?: boolean;
  className?: string;
}

export function OnboardingProgress({ showDetails = true, className = "" }: OnboardingProgressProps) {
  const { steps, progress, nextStep, isFullyActivated, isLoading } = useOnboarding();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-2 bg-gray-200 rounded mb-2"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isFullyActivated) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Onboarding Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">
              Congratulations! Your shop is fully activated and ready to sell.
            </p>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              100% Complete
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter steps to only show those that are actually required for this seller
  const visibleSteps = steps.filter(step => {
    // Always show base steps
    if (step.stepKey !== "gpsr_compliance") {
      return true;
    }
    
    // Only show GPSR step if it exists in the steps array (meaning it's required)
    return step.stepKey === "gpsr_compliance";
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Onboarding Progress</span>
          <Badge variant="outline">{progress}%</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Next Step Indicator */}
        {nextStep && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Clock className="h-4 w-4 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Next: {STEP_CONFIG[nextStep].title}
              </p>
              <p className="text-xs text-blue-700">
                {STEP_CONFIG[nextStep].description}
              </p>
            </div>
          </div>
        )}

        {/* Step Details */}
        {showDetails && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Steps</h4>
            <div className="space-y-2">
              {visibleSteps.map((step) => {
                const config = STEP_CONFIG[step.stepKey];
                const isNext = nextStep === step.stepKey;
                
                return (
                  <div
                    key={step.stepKey}
                    className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                      step.completed 
                        ? "bg-green-50 border border-green-200" 
                        : isNext
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {step.completed ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : isNext ? (
                        <Clock className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Circle className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        step.completed 
                          ? "text-green-900" 
                          : isNext
                          ? "text-blue-900"
                          : "text-gray-700"
                      }`}>
                        {config.title}
                      </p>
                      <p className={`text-xs ${
                        step.completed 
                          ? "text-green-700" 
                          : isNext
                          ? "text-blue-700"
                          : "text-gray-500"
                      }`}>
                        {config.description}
                      </p>
                      {step.completedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          Completed {new Date(step.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for smaller displays
export function OnboardingProgressCompact({ className = "" }: { className?: string }) {
  return <OnboardingProgress showDetails={false} className={className} />;
}

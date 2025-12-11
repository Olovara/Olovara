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
import {
  CheckCircle,
  Circle,
  ArrowRight,
} from "lucide-react";
import { OnboardingStepData } from "@/lib/onboarding";
import Link from "next/link";

interface OptionalOnboardingTasksProps {
  steps: OnboardingStepData[];
}

/**
 * Component to display optional onboarding tasks at the bottom of the dashboard
 * These tasks don't block seller functionality but are recommended
 */
export function OptionalOnboardingTasks({ steps }: OptionalOnboardingTasksProps) {
  // Filter to only show optional steps (GPSR compliance)
  const optionalSteps = steps.filter(step => step.stepKey === "gpsr_compliance");
  
  // Only show if there are incomplete optional steps
  const incompleteOptionalSteps = optionalSteps.filter(step => !step.completed);
  
  if (incompleteOptionalSteps.length === 0) {
    return null; // Don't show if all optional steps are complete
  }

  const getStepInfo = (stepKey: string) => {
    switch (stepKey) {
      case "gpsr_compliance":
        return {
          title: "EU Compliance (Optional)",
          description: "Complete GPSR compliance to sell to EU/EEA countries.",
          actionUrl: "/seller/dashboard/settings#exclusions",
          actionText: "Setup GPSR Compliance",
        };
      default:
        return null;
    }
  };

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-2xl font-semibold">Optional Setup Tasks</h2>
      <p className="text-muted-foreground">
        These tasks are optional but recommended to expand your selling capabilities.
      </p>
      
      <div className="grid gap-4">
        {incompleteOptionalSteps.map((step) => {
          const stepInfo = getStepInfo(step.stepKey);
          if (!stepInfo) return null;

          return (
            <Card key={step.stepKey} className="border-purple-200 bg-purple-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Circle className="h-5 w-5 text-purple-500" />
                    <div>
                      <CardTitle className="text-lg">{stepInfo.title}</CardTitle>
                      <CardDescription>{stepInfo.description}</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-purple-800"
                  >
                    Optional
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild size="sm" className="mt-2">
                  <Link href={stepInfo.actionUrl}>
                    {stepInfo.actionText}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

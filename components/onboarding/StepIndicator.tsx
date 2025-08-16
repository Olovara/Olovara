import React from "react";
import { CheckCircle, Circle } from "lucide-react";

// Simple step configuration for onboarding
const ONBOARDING_STEPS = [
  { key: "shop-preferences", title: "Shop Setup", number: 1 },
  { key: "shop-naming", title: "Shop Name", number: 2 },
  { key: "create-first-product", title: "First Product", number: 3 },
  { key: "payment-setup", title: "Get Paid", number: 4 },
];

interface StepIndicatorProps {
  currentStep: string;
  className?: string;
}

export function StepIndicator({ currentStep, className = "" }: StepIndicatorProps) {
  const currentStepIndex = ONBOARDING_STEPS.findIndex(step => step.key === currentStep);
  const currentStepNumber = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;

  return (
    <div className={`flex justify-center items-center space-x-4 ${className}`}>
      {ONBOARDING_STEPS.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        
        return (
          <div key={step.key} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              isCompleted 
                ? "bg-blue-500 border-blue-400 text-white" 
                : isCurrent
                ? "bg-purple-500 border-purple-400 text-white"
                : "bg-gray-200 border-gray-300 text-gray-500"
            }`}>
              {isCompleted ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <span className="text-sm font-medium">{step.number}</span>
              )}
            </div>
            {index < ONBOARDING_STEPS.length - 1 && (
              <div className={`w-8 h-0.5 mx-2 ${
                isCompleted ? "bg-blue-500" : "bg-gray-300"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

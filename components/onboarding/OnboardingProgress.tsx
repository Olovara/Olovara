"use client";

import { CheckCircle, Circle } from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  path: string;
}

interface OnboardingProgressProps {
  currentStep: string;
  steps: OnboardingStep[];
}

export default function OnboardingProgress({
  currentStep,
  steps,
}: OnboardingProgressProps) {
  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted =
            steps.findIndex((s) => s.id === currentStep) > index;
          const isCurrent = step.id === currentStep;

          return (
            <div key={step.id} className="flex items-center">
              {/* Step Circle */}
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  isCompleted
                    ? "bg-blue-500 border-blue-500 text-white"
                    : isCurrent
                      ? "bg-purple-500 border-purple-500 text-white"
                      : "bg-gray-200 border-gray-300 text-gray-500"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>

              {/* Step Title */}
              <div className="ml-3">
                <p
                  className={`text-sm font-medium ${
                    isCompleted
                      ? "text-blue-600"
                      : isCurrent
                        ? "text-purple-600"
                        : "text-gray-500"
                  }`}
                >
                  {step.title}
                </p>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    isCompleted ? "bg-blue-500" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

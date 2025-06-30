"use client";

import React from "react";
import { useOnboardingSurvey } from "@/hooks/use-onboarding-survey";
import OnboardingSurveyModal from "@/components/seller/OnboardingSurveyModal";

interface OnboardingSurveyProviderProps {
  children: React.ReactNode;
}

export function OnboardingSurveyProvider({ children }: OnboardingSurveyProviderProps) {
  const { showSurvey, closeSurvey } = useOnboardingSurvey();

  return (
    <>
      {children}
      <OnboardingSurveyModal isOpen={showSurvey} onClose={closeSurvey} />
    </>
  );
} 
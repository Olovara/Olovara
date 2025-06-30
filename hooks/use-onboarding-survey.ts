"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { hasSubmittedOnboardingSurvey } from "@/actions/onboardingSurveyActions";

export function useOnboardingSurvey() {
  const { data: session, status } = useSession();
  const [showSurvey, setShowSurvey] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const checkSurveyEligibility = async () => {
      if (status === "loading" || !session?.user?.id) {
        return;
      }

      // Check if user is a fully activated seller
      const sellerOnboarding = session.user.sellerOnboarding;
      if (!sellerOnboarding?.isFullyActivated) {
        setHasChecked(true);
        return;
      }

      // Check if user has already submitted a survey
      try {
        const { hasSubmitted } = await hasSubmittedOnboardingSurvey();
        
        if (!hasSubmitted) {
          // Show survey after a short delay to let the page load
          setTimeout(() => {
            setShowSurvey(true);
          }, 2000);
        }
      } catch (error) {
        console.error("Error checking survey submission:", error);
      } finally {
        setHasChecked(true);
      }
    };

    checkSurveyEligibility();
  }, [session, status]);

  const closeSurvey = () => {
    setShowSurvey(false);
  };

  return {
    showSurvey,
    closeSurvey,
    hasChecked,
    isLoading: status === "loading",
  };
} 
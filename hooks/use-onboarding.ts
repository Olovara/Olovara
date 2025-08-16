import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { OnboardingStepKey, OnboardingStepData } from "@/lib/onboarding";

interface UseOnboardingReturn {
  steps: OnboardingStepData[];
  progress: number;
  nextStep: OnboardingStepKey | null;
  isFullyActivated: boolean;
  isLoading: boolean;
  updateStep: (stepKey: OnboardingStepKey, completed: boolean) => Promise<void>;
  refreshSteps: () => Promise<void>;
}

/**
 * React hook for managing seller onboarding steps (new system)
 */
export function useOnboarding(): UseOnboardingReturn {
  const { data: session } = useSession();
  const [steps, setSteps] = useState<OnboardingStepData[]>([]);
  const [progress, setProgress] = useState(0);
  const [nextStep, setNextStep] = useState<OnboardingStepKey | null>(null);
  const [isFullyActivated, setIsFullyActivated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch onboarding data
  const fetchOnboardingData = useCallback(async () => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/seller/onboarding");
      if (response.ok) {
        const result = await response.json();
        
        // Handle the nested data structure from the API
        const data = result.data || result;
        
        setSteps(data.steps || []);
        setProgress(data.progress || 0);
        setNextStep(data.nextStep || null);
        setIsFullyActivated(data.isFullyActivated || false);
        
        console.log("Onboarding data fetched:", data);
      }
    } catch (error) {
      console.error("Failed to fetch onboarding data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Update a specific onboarding step
  const updateStep = useCallback(async (stepKey: OnboardingStepKey, completed: boolean) => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch("/api/seller/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stepKey, completed }),
      });

      if (response.ok) {
        // Refresh the data after updating
        await fetchOnboardingData();
      } else {
        throw new Error("Failed to update onboarding step");
      }
    } catch (error) {
      console.error("Failed to update onboarding step:", error);
      throw error;
    }
  }, [session?.user?.id, fetchOnboardingData]);

  // Refresh onboarding data
  const refreshSteps = useCallback(async () => {
    await fetchOnboardingData();
  }, [fetchOnboardingData]);

  // Load data on mount and when session changes
  useEffect(() => {
    fetchOnboardingData();
  }, [fetchOnboardingData]);

  return {
    steps,
    progress,
    nextStep,
    isFullyActivated,
    isLoading,
    updateStep,
    refreshSteps,
  };
}

/**
 * Hook to get onboarding progress for display purposes
 */
export function useOnboardingProgress() {
  const { steps, progress, isLoading } = useOnboarding();

  const getStepStatus = useCallback((stepKey: OnboardingStepKey) => {
    const step = steps.find(s => s.stepKey === stepKey);
    return {
      completed: step?.completed ?? false,
      completedAt: step?.completedAt,
    };
  }, [steps]);

  const getCompletedStepsCount = useCallback(() => {
    return steps.filter(step => step.completed).length;
  }, [steps]);

  const getTotalStepsCount = useCallback(() => {
    return steps.length;
  }, [steps]);

  return {
    progress,
    isLoading,
    getStepStatus,
    getCompletedStepsCount,
    getTotalStepsCount,
    steps,
  };
}

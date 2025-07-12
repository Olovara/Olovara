"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

interface OnboardingStatus {
  applicationAccepted: boolean;
  stripeConnected: boolean;
  shopProfileComplete: boolean;
  shippingProfileCreated: boolean;
  isFullyActivated: boolean;
  currentStep: string;
  completionPercentage: number;
}

export function useSellerOnboardingAPI() {
  const { data: session, status } = useSession();
  const [onboardingData, setOnboardingData] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOnboardingData = async () => {
      if (status === "loading") {
        return;
      }

      if (!session?.user?.id) {
        setOnboardingData(null);
        setLoading(false);
        setError("Not authenticated");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log("useSellerOnboardingAPI - Fetching data for user:", session.user.id);
        
        const response = await fetch('/api/seller/onboarding');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        console.log("useSellerOnboardingAPI - Received data:", result);
        
        if (result.success) {
          setOnboardingData(result.data);
        } else {
          setError(result.error || "Failed to fetch onboarding data");
        }
      } catch (err) {
        console.error("Error fetching seller onboarding data:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch onboarding data");
      } finally {
        setLoading(false);
      }
    };

    fetchOnboardingData();
  }, [session?.user?.id, status]);

  const refresh = async () => {
    console.log("useSellerOnboardingAPI - Manual refresh triggered");
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/seller/onboarding');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setOnboardingData(result.data);
      } else {
        setError(result.error || "Failed to fetch onboarding data");
      }
    } catch (err) {
      console.error("Error refreshing seller onboarding data:", err);
      setError(err instanceof Error ? err.message : "Failed to refresh onboarding data");
    } finally {
      setLoading(false);
    }
  };

  return {
    status: onboardingData,
    loading,
    error,
    refresh,
  };
} 
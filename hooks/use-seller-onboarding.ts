"use client";

import { useSession } from "next-auth/react";

interface OnboardingStatus {
  applicationAccepted: boolean;
  stripeConnected: boolean;
  shopProfileComplete: boolean;
  shippingProfileCreated: boolean;
  isFullyActivated: boolean;
  currentStep: string;
  completionPercentage: number;
}

export function useSellerOnboarding() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return {
      status: null,
      loading: true,
      error: null,
      refresh: () => {},
    };
  }

  if (!session?.user?.sellerOnboarding) {
    return {
      status: null,
      loading: false,
      error: "No seller onboarding data found",
      refresh: () => {},
    };
  }

  const onboardingData = session.user.sellerOnboarding;
  
  // Calculate completion percentage
  let completionPercentage = 0;
  if (onboardingData.applicationAccepted) completionPercentage += 20;
  if (onboardingData.shopProfileComplete) completionPercentage += 20;
  if (onboardingData.stripeConnected) completionPercentage += 20;
  if (onboardingData.shippingProfileCreated) completionPercentage += 20;
  if (onboardingData.isFullyActivated) completionPercentage += 20;

  // Determine current step
  let currentStep = 'application_submitted';
  if (!onboardingData.applicationAccepted) {
    currentStep = 'application_approved';
  } else if (!onboardingData.shopProfileComplete) {
    currentStep = 'profile_completed';
  } else if (!onboardingData.stripeConnected) {
    currentStep = 'stripe_connected';
  } else if (!onboardingData.shippingProfileCreated) {
    currentStep = 'shipping_profile_created';
  } else {
    currentStep = 'fully_activated';
  }

  const statusData: OnboardingStatus = {
    applicationAccepted: onboardingData.applicationAccepted,
    stripeConnected: onboardingData.stripeConnected,
    shopProfileComplete: onboardingData.shopProfileComplete,
    shippingProfileCreated: onboardingData.shippingProfileCreated,
    isFullyActivated: onboardingData.isFullyActivated,
    currentStep,
    completionPercentage,
  };

  return {
    status: statusData,
    loading: false,
    error: null,
    refresh: () => {
      // Force session refresh
      window.location.reload();
    },
  };
} 
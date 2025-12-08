"use client";

import { usePermissions } from "@/components/providers/PermissionProvider";
import { useSession } from "next-auth/react";
import SellerDashboardInfo from "./SellerDashboardInfo";
import SellerOnboardingDashboard from "@/components/seller/SellerOnboardingDashboard";
import { OnboardingSurveyProvider } from "@/components/providers/OnboardingSurveyProvider";
import { SessionRefreshButton } from "@/components/SessionRefreshButton";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useEffect } from "react";

export function SellerDashboardContent() {
  const { data: session } = useSession();
  const { role, loading: permissionsLoading, error: permissionsError, refreshPermissions } = usePermissions();
  const { steps, isFullyActivated, isLoading: onboardingLoading } = useOnboarding();

  // Refresh permissions on mount to ensure we have the latest role
  // This helps when user just completed onboarding
  useEffect(() => {
    if (session?.user?.id && !permissionsLoading) {
      // Check if cache might be stale (older than 30 seconds)
      if (typeof window !== 'undefined') {
        const timestamp = localStorage.getItem('yarnnu_permissions_timestamp');
        if (timestamp) {
          const age = Date.now() - parseInt(timestamp);
          // If cache is older than 30 seconds, refresh
          if (age > 30000) {
            refreshPermissions();
          }
        } else {
          // No cache, fetch fresh
          refreshPermissions();
        }
      }
    }
  }, [session?.user?.id, permissionsLoading, refreshPermissions]);

  // Debug logging
  console.log("SellerDashboardContent - Debug:", {
    sessionUserId: session?.user?.id,
    role,
    permissionsLoading,
    permissionsError,
    steps,
    stepsLength: steps?.length,
    isFullyActivated,
    onboardingLoading
  });

  // Show loading state
  if (permissionsLoading || onboardingLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we load your dashboard.</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (permissionsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{permissionsError}</p>
          <SessionRefreshButton 
            onRefresh={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </SessionRefreshButton>
        </div>
      </div>
    );
  }

  // Check if user is a seller (only after permissions have loaded)
  if (!permissionsLoading && role !== 'SELLER') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You need to be a seller to access this dashboard. Please submit a seller application first.
          </p>
          <div className="space-x-4">
            <a 
              href="/seller-application" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Apply to Become a Seller
            </a>
            <SessionRefreshButton 
              onRefresh={() => window.location.reload()}
              variant="outline"
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Refresh Page
            </SessionRefreshButton>
          </div>
        </div>
      </div>
    );
  }

  // If no seller data, show error
  if (!steps || steps.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Seller Profile Not Found</h2>
          <p className="text-gray-600 mb-4">
            It looks like your seller profile hasn&apos;t been created yet. Please submit a seller application first.
          </p>
          <div className="space-x-4">
            <a 
              href="/seller-application" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Apply to Become a Seller
            </a>
            <SessionRefreshButton 
              onRefresh={() => window.location.reload()}
              variant="outline"
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Refresh Page
            </SessionRefreshButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <OnboardingSurveyProvider>
      <div>
        {isFullyActivated ? (
          <>
            <h1 className="text-3xl font-bold mb-4">Seller Dashboard</h1>
            <SellerDashboardInfo />
          </>
        ) : (
          <SellerOnboardingDashboard />
        )}
      </div>
    </OnboardingSurveyProvider>
  );
} 
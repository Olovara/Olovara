"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { sellerHasFeature } from "@/lib/subscription-helpers";
import { useEffect, useState } from "react";

/**
 * Hook to check if the current seller has access to Studio plan features
 * Specifically checks for website builder access
 */
export function useStudioPlanAccess() {
  const user = useCurrentUser();
  const [hasWebsiteBuilderAccess, setHasWebsiteBuilderAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (!user?.id) {
        setHasWebsiteBuilderAccess(false);
        setIsLoading(false);
        return;
      }

      try {
        // Check if seller has website builder feature (only available in Studio plan)
        const hasAccess = await sellerHasFeature(user.id, 'websiteBuilder');
        setHasWebsiteBuilderAccess(hasAccess);
      } catch (error) {
        console.error('Error checking studio plan access:', error);
        setHasWebsiteBuilderAccess(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAccess();
  }, [user?.id]);

  return {
    hasWebsiteBuilderAccess,
    isLoading,
    // Helper to check if user is on any Studio plan (including free)
    isStudioPlan: hasWebsiteBuilderAccess
  };
}

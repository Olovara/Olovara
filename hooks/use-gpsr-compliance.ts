import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { isSellerGPSRComplianceRequired } from "@/lib/gpsr-compliance";

interface UseGPSRComplianceReturn {
  isGPSRRequired: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to check if GPSR compliance is required for the current seller
 * This checks the seller's location and shipping preferences
 */
export function useGPSRCompliance(): UseGPSRComplianceReturn {
  const { data: session } = useSession();
  const [isGPSRRequired, setIsGPSRRequired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkGPSRRequirement() {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch seller data to check location and shipping preferences
        const response = await fetch("/api/seller/gpsr-requirement");
        
        if (!response.ok) {
          throw new Error("Failed to fetch GPSR requirement");
        }

        const data = await response.json();
        setIsGPSRRequired(data.isGPSRRequired);
      } catch (err) {
        console.error("Error checking GPSR requirement:", err);
        setError(err instanceof Error ? err.message : "Failed to check GPSR requirement");
        // Default to requiring GPSR compliance if we can't determine
        setIsGPSRRequired(true);
      } finally {
        setIsLoading(false);
      }
    }

    checkGPSRRequirement();
  }, [session?.user?.id]);

  return {
    isGPSRRequired,
    isLoading,
    error
  };
}

/**
 * Hook to check if GPSR compliance is required based on provided data
 * This is useful when you already have the seller's location and shipping data
 */
export function useGPSRComplianceWithData(
  shopCountry: string,
  excludedCountries: string[] = []
): boolean {
  return isSellerGPSRComplianceRequired(shopCountry, excludedCountries);
}

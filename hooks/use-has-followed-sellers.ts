"use client";

import { useState, useEffect } from "react";
import { getFollowedSellers } from "@/actions/followActions";

export function useHasFollowedSellers() {
  const [hasFollowedSellers, setHasFollowedSellers] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkFollowedSellers() {
      try {
        const followedSellers = await getFollowedSellers();
        setHasFollowedSellers(followedSellers.length > 0);
      } catch (error) {
        console.error("Error checking followed sellers:", error);
        setHasFollowedSellers(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkFollowedSellers();
  }, []);

  return { hasFollowedSellers, isLoading };
}

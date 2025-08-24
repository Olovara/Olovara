"use client";

import { useState, useEffect } from "react";
import {
  followSeller,
  unfollowSeller,
  isFollowingSeller,
} from "@/actions/followActions";
import { toast } from "sonner";

interface UseFollowReturn {
  isFollowing: boolean;
  followerCount: number;
  isLoading: boolean;
  isInitialized: boolean;
  follow: () => Promise<void>;
  unfollow: () => Promise<void>;
  toggleFollow: () => Promise<void>;
}

/**
 * Custom hook for managing follow state for a seller
 * @param sellerId - The ID of the seller
 * @param initialFollowerCount - Initial follower count (optional)
 * @returns Follow state and operations
 */
export function useFollow(
  sellerId: string,
  initialFollowerCount: number = 0
): UseFollowReturn {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check initial follow status
  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const following = await isFollowingSeller(sellerId);
        setIsFollowing(following);
      } catch (error) {
        console.error("Error checking follow status:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    if (sellerId) {
      checkFollowStatus();
    }
  }, [sellerId]);

  const follow = async () => {
    if (isLoading || isFollowing) return;

    setIsLoading(true);
    try {
      const result = await followSeller(sellerId);
      if (result.success) {
        setIsFollowing(true);
        setFollowerCount(result.followerCount || followerCount + 1);
        toast.success(result.message);
      } else {
        toast.error(result.error || "Failed to follow seller");
      }
    } catch (error) {
      console.error("Error following seller:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const unfollow = async () => {
    if (isLoading || !isFollowing) return;

    setIsLoading(true);
    try {
      const result = await unfollowSeller(sellerId);
      if (result.success) {
        setIsFollowing(false);
        setFollowerCount(
          result.followerCount || Math.max(0, followerCount - 1)
        );
        toast.success(result.message);
      } else {
        toast.error(result.error || "Failed to unfollow seller");
      }
    } catch (error) {
      console.error("Error unfollowing seller:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFollow = async () => {
    if (isFollowing) {
      await unfollow();
    } else {
      await follow();
    }
  };

  return {
    isFollowing,
    followerCount,
    isLoading,
    isInitialized,
    follow,
    unfollow,
    toggleFollow,
  };
}

/**
 * Hook for managing multiple follow states
 * @param sellerIds - Array of seller IDs to track
 * @returns Object with follow states for each seller
 */
export function useMultipleFollows(sellerIds: string[]) {
  const [followStates, setFollowStates] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAllFollowStatuses = async () => {
      try {
        setIsLoading(true);
        const states: Record<string, boolean> = {};

        await Promise.all(
          sellerIds.map(async (sellerId) => {
            const following = await isFollowingSeller(sellerId);
            states[sellerId] = following;
          })
        );

        setFollowStates(states);
      } catch (error) {
        console.error("Error checking follow statuses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (sellerIds.length > 0) {
      checkAllFollowStatuses();
    } else {
      setIsLoading(false);
    }
  }, [sellerIds]);

  const updateFollowState = (sellerId: string, isFollowing: boolean) => {
    setFollowStates((prev) => ({
      ...prev,
      [sellerId]: isFollowing,
    }));
  };

  return {
    followStates,
    isLoading,
    updateFollowState,
  };
}

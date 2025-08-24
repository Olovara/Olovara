"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { followSeller, unfollowSeller, isFollowingSeller } from "@/actions/followActions";
import { toast } from "sonner";

interface FollowButtonProps {
  sellerId: string;
  sellerName: string;
  initialFollowerCount?: number;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  showCount?: boolean;
  className?: string;
}

export default function FollowButton({
  sellerId,
  sellerName,
  initialFollowerCount = 0,
  variant = "outline",
  size = "default",
  showCount = false,
  className = ""
}: FollowButtonProps) {
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

    checkFollowStatus();
  }, [sellerId]);

  const handleFollowToggle = async () => {
    if (isLoading) return;

    setIsLoading(true);
    
    try {
      if (isFollowing) {
        // Unfollow
        const result = await unfollowSeller(sellerId);
        if (result.success) {
          setIsFollowing(false);
          setFollowerCount(result.followerCount || followerCount - 1);
          toast.success(result.message);
        } else {
          toast.error(result.error || "Failed to unfollow seller");
        }
      } else {
        // Follow
        const result = await followSeller(sellerId);
        if (result.success) {
          setIsFollowing(true);
          setFollowerCount(result.followerCount || followerCount + 1);
          toast.success(result.message);
        } else {
          toast.error(result.error || "Failed to follow seller");
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render until we know the initial state
  if (!isInitialized) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={`animate-pulse ${className}`}
      >
        <div className="w-4 h-4 bg-current rounded opacity-50" />
        {showCount && <span className="ml-2">-</span>}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleFollowToggle}
      disabled={isLoading}
      className={`transition-all duration-200 ${
        isFollowing 
          ? "bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100" 
          : ""
      } ${className}`}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <Heart className={`w-4 h-4 ${isFollowing ? "fill-current" : ""}`} />
      )}
      
      <span className="ml-2">
        {isFollowing ? "Following" : "Follow"}
      </span>
      
      {showCount && followerCount > 0 && (
        <span className="ml-2 text-xs opacity-70">
          {followerCount.toLocaleString()}
        </span>
      )}
    </Button>
  );
}

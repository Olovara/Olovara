"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UpvoteButtonProps {
  suggestionId: string;
  initialUpvotes: number;
  hasUpvoted: boolean;
  disabled?: boolean;
}

export function UpvoteButton({ 
  suggestionId, 
  initialUpvotes, 
  hasUpvoted: initialHasUpvoted,
  disabled 
}: UpvoteButtonProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [hasUpvoted, setHasUpvoted] = useState(initialHasUpvoted);
  const router = useRouter();

  const handleUpvote = async () => {
    if (disabled) {
      toast.error("Please sign in to upvote suggestions");
      return;
    }

    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/upvote`, {
        method: hasUpvoted ? "DELETE" : "POST",
      });

      if (!response.ok) throw new Error("Failed to upvote");

      setHasUpvoted(!hasUpvoted);
      setUpvotes(prev => hasUpvoted ? prev - 1 : prev + 1);
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleUpvote}
      className={`flex items-center gap-1 ${hasUpvoted ? "text-primary" : ""}`}
      disabled={disabled}
    >
      <ChevronUp className="h-4 w-4" />
      <span>{upvotes}</span>
    </Button>
  );
} 
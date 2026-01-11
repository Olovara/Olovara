"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { UpvoteButton } from "./upvote-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SuggestionCardProps {
  suggestion: {
    id: string;
    title: string;
    description: string;
    type: string;
    upvoteCount: number;
    createdAt: Date;
    userId: string;
    user: {
      username: string | null;
    };
    upvotes: {
      userId: string;
    }[];
  };
  currentUserId?: string;
}

const TYPE_COLORS: Record<string, string> = {
  Feature: "bg-blue-500/10 text-blue-500",
  Bug: "bg-red-500/10 text-red-500",
  Improvement: "bg-green-500/10 text-green-500",
  Addition: "bg-purple-500/10 text-purple-500",
  Other: "bg-gray-500/10 text-gray-500",
};

export function SuggestionCard({
  suggestion,
  currentUserId,
}: SuggestionCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const hasUpvoted = currentUserId
    ? suggestion.upvotes.some((upvote) => upvote.userId === currentUserId)
    : false;

  // Check if current user is the owner of this suggestion
  const isOwner = currentUserId === suggestion.userId;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/suggestions/${suggestion.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to delete suggestion");
      }

      toast.success("Suggestion deleted successfully");
      setDeleteOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error deleting suggestion:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete suggestion"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="relative">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-xl">{suggestion.title}</CardTitle>
              <div className="text-sm text-muted-foreground">
                Suggested by {suggestion.user.username || "Anonymous"} •{" "}
                {formatDistanceToNow(suggestion.createdAt)} ago
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={TYPE_COLORS[suggestion.type] || TYPE_COLORS.Other}
              >
                {suggestion.type}
              </Badge>
              {/* Show delete button only if user is the owner */}
              {isOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteOpen(true)}
                  aria-label="Delete suggestion"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{suggestion.description}</p>
          <div className="flex items-center justify-end gap-2">
            <UpvoteButton
              suggestionId={suggestion.id}
              initialUpvotes={suggestion.upvoteCount}
              hasUpvoted={hasUpvoted}
              disabled={!currentUserId}
            />
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation modal */}
      <DeleteConfirmationModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        title="Delete Suggestion"
        description="Are you sure you want to delete this suggestion? This action cannot be undone."
        itemName={suggestion.title}
        isLoading={isDeleting}
      />
    </>
  );
}

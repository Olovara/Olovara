import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { UpvoteButton } from "./upvote-button";
import { Badge } from "@/components/ui/badge";

interface SuggestionCardProps {
  suggestion: {
    id: string;
    title: string;
    description: string;
    type: string;
    upvoteCount: number;
    createdAt: Date;
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

export function SuggestionCard({ suggestion, currentUserId }: SuggestionCardProps) {
  const hasUpvoted = currentUserId 
    ? suggestion.upvotes.some(upvote => upvote.userId === currentUserId)
    : false;

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl">{suggestion.title}</CardTitle>
            <div className="text-sm text-muted-foreground">
              Suggested by {suggestion.user.username || "Anonymous"} • {formatDistanceToNow(suggestion.createdAt)} ago
            </div>
          </div>
          <Badge className={TYPE_COLORS[suggestion.type] || TYPE_COLORS.Other}>
            {suggestion.type}
          </Badge>
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
  );
} 
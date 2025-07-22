"use client";

import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";

interface CommentCountProps {
  postSlug: string;
  className?: string;
}

export default function CommentCount({ postSlug, className = "" }: CommentCountProps) {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommentCount = async () => {
      try {
        const response = await fetch(`/api/blog/comments?postSlug=${postSlug}`);
        if (response.ok) {
          const comments = await response.json();
          // Count all comments including replies
          const totalCount = comments.reduce((total: number, comment: any) => {
            return total + 1 + (comment.replies?.length || 0);
          }, 0);
          setCount(totalCount);
        }
      } catch (error) {
        console.error("Error fetching comment count:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommentCount();
  }, [postSlug]);

  if (loading) {
    return (
      <div className={`flex items-center gap-1 text-muted-foreground text-sm ${className}`}>
        <MessageCircle className="h-4 w-4" />
        <span>...</span>
      </div>
    );
  }

  if (count === null || count === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 text-muted-foreground text-sm ${className}`}>
      <MessageCircle className="h-4 w-4" />
      <span>{count}</span>
    </div>
  );
} 
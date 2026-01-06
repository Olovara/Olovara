"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandableDescriptionProps {
  text: string;
  maxLength?: number;
  className?: string;
}

export function ExpandableDescription({
  text,
  maxLength = 200,
  className = "",
}: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // If text is shorter than maxLength, don't show expand/collapse
  if (!text || text.length <= maxLength) {
    return (
      <p className={`text-sm text-muted-foreground ${className}`}>{text}</p>
    );
  }

  const truncatedText = text.slice(0, maxLength);
  const displayText = isExpanded ? text : truncatedText;

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
        {displayText}
        {!isExpanded && "..."}
      </p>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-8 text-xs"
      >
        {isExpanded ? (
          <>
            Show Less
            <ChevronUp className="ml-1 h-3 w-3" />
          </>
        ) : (
          <>
            Show More
            <ChevronDown className="ml-1 h-3 w-3" />
          </>
        )}
      </Button>
    </div>
  );
}


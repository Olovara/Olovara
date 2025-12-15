"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface QaEventViewerProps {
  event: {
    id: string;
    userId: string;
    sessionId: string;
    event: string;
    step: string | null;
    status: string;
    route: string | null;
    metadata: any;
    createdAt: Date | string;
    user?: {
      id: string;
      email: string | null;
      username: string | null;
    };
  };
}

export function QaEventViewer({ event }: QaEventViewerProps) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return format(dateObj, "MMM dd, yyyy HH:mm:ss");
    } catch {
      return "Invalid date";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="text-xs">
            Completed
          </Badge>
        );
      case "started":
        return (
          <Badge variant="secondary" className="text-xs">
            Started
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="text-xs">
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {status}
          </Badge>
        );
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-mono">
              {event.event}
              {event.step && (
                <span className="text-muted-foreground ml-2">
                  → {event.step}
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge(event.status)}
              {event.user && (
                <Badge variant="outline" className="text-xs">
                  {event.user.email || event.user.username || "Unknown"}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDate(event.createdAt)}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 space-y-2">
          {event.route && (
            <div>
              <span className="text-xs font-semibold text-muted-foreground">
                Route:
              </span>
              <span className="text-xs font-mono ml-2">{event.route}</span>
            </div>
          )}
          <div>
            <span className="text-xs font-semibold text-muted-foreground">
              Session ID:
            </span>
            <span className="text-xs font-mono ml-2">{event.sessionId}</span>
          </div>
          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <div>
              <span className="text-xs font-semibold text-muted-foreground">
                Metadata:
              </span>
              <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-auto max-h-48">
                {JSON.stringify(event.metadata, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

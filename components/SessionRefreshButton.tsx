"use client";

import { Button } from "@/components/ui/button";

interface SessionRefreshButtonProps {
  onRefresh: () => void;
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
}

export function SessionRefreshButton({ 
  onRefresh, 
  children, 
  variant = "default",
  className = ""
}: SessionRefreshButtonProps) {
  return (
    <Button 
      onClick={onRefresh}
      variant={variant}
      className={className}
    >
      {children}
    </Button>
  );
} 
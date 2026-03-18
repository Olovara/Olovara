"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Flag } from "lucide-react";
import ReportModal from "./ReportModal";
import { cn } from "@/lib/utils";

interface ReportButtonProps {
  reportType: "SELLER" | "PRODUCT";
  targetId: string;
  targetName: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
}

export default function ReportButton({
  reportType,
  targetId,
  targetName,
  variant = "outline",
  size = "sm",
  className = "",
  children
}: ReportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsModalOpen(true)}
        className={cn(
          "text-red-600 hover:text-red-700",
          // Ghost/outline hover uses accent bg by default — keep bg flat; only text changes on hover
          variant === "ghost" &&
            "bg-transparent hover:bg-transparent focus-visible:bg-transparent active:bg-transparent",
          className
        )}
      >
        <Flag className="h-4 w-4 mr-2" />
        {children || `Report ${reportType === "SELLER" ? "Seller" : "Product"}`}
      </Button>

      <ReportModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        reportType={reportType}
        targetId={targetId}
        targetName={targetName}
      />
    </>
  );
} 
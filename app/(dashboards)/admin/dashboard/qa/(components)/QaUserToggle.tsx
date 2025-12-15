"use client";

import { Button } from "@/components/ui/button";
import { toggleQaUserMode } from "@/actions/qa-management";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface QaUserToggleProps {
  userId: string;
  isQaUser: boolean;
}

export function QaUserToggle({ userId, isQaUser }: QaUserToggleProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setLoading(true);
    try {
      const result = await toggleQaUserMode(userId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to toggle QA mode");
      }
    } catch (error) {
      console.error("Failed to toggle QA mode:", error);
      alert("Failed to toggle QA mode");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={isQaUser ? "destructive" : "default"}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isQaUser ? "Disabling..." : "Enabling..."}
        </>
      ) : isQaUser ? (
        "Disable QA Mode"
      ) : (
        "Enable QA Mode"
      )}
    </Button>
  );
}

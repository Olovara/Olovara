"use client"; // This makes the component a Client Component

import { Button } from "@/components/ui/button";

export function ApplicationActions({ applicationId }: { applicationId: string }) {
  const approveApplication = async () => {
    try {
      const response = await fetch(`/api/applications/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });

      if (!response.ok) throw new Error("Failed to approve application.");
      alert("Application approved!");
    } catch (error) {
      console.error(error);
      alert("An error occurred while approving the application.");
    }
  };

  const rejectApplication = async () => {
    try {
      const response = await fetch(`/api/applications/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });

      if (!response.ok) throw new Error("Failed to reject application.");
      alert("Application rejected!");
    } catch (error) {
      console.error(error);
      alert("An error occurred while rejecting the application.");
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={approveApplication}>
        Approve
      </Button>
      <Button variant="destructive" onClick={rejectApplication}>
        Reject
      </Button>
    </div>
  );
}
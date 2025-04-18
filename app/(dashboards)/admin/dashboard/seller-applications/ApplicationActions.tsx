"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Application {
  id: string;
  username: string;
  email: string;
  craftingProcess?: string;
  portfolio?: string;
  reason?: string;
}

export function ApplicationActions({
  application,
}: {
  application: Application;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false); // State for loading
  const [error, setError] = useState<string | null>(null); // State for error message
  const [success, setSuccess] = useState<boolean | null>(null); // State for success message

  if (!application) {
    return null; // Ensure we don't render if `application` is undefined
  }

  const handleApprove = async () => {
    setLoading(true); // Set loading to true while the request is being processed
    setError(null); // Clear previous error message
    setSuccess(null); // Clear previous success message

    try {
      const response = await fetch("/api/applications/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ applicationId: application.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to approve application");
      } else {
        setSuccess(true); // Show success message
        // Optionally, you can trigger UI updates here if needed
      }
    } catch (error) {
      setError("Error during approval");
    } finally {
      setLoading(false); // Disable loading state after the request is completed
    }
  };

  const handleReject = async () => {
    setLoading(true); // Set loading to true while the request is being processed
    setError(null); // Clear previous error message
    setSuccess(null); // Clear previous success message

    try {
      const response = await fetch("/api/applications/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ applicationId: application.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to reject application");
      } else {
        setSuccess(false); // Show success message for rejection
        // Optionally, trigger UI updates
      }
    } catch (error) {
      setError("Error during rejection");
    } finally {
      setLoading(false); // Disable loading state after the request is completed
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">View</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Seller Application</DialogTitle>
          <DialogDescription>
            Detailed information about the seller&apos;s application.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <strong>Username:</strong> {application.username || "N/A"}
          </div>
          <div>
            <strong>Email:</strong> {application.email || "N/A"}
          </div>
          <div>
            <strong>Crafting Process:</strong>{" "}
            {application.craftingProcess || "N/A"}
          </div>
          <div>
            <strong>Portfolio:</strong> {application.portfolio || "N/A"}
          </div>
          <div>
            <strong>Reason for Joining:</strong> {application.reason || "N/A"}
          </div>
        </div>

        {/* Success/Error messages */}
        {success !== null && (
          <div className={`mt-2 ${success ? "text-green-500" : "text-red-500"}`}>
            {success ? "Application approved!" : "Application rejected!"}
          </div>
        )}

        {error && (
          <div className="mt-2 text-red-500">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleReject}
            disabled={loading} // Disable button while loading
          >
            {loading ? "Rejecting..." : "Reject"}{" "}
            {/* Show loading text or spinner */}
          </Button>
          <Button
            onClick={handleApprove}
            disabled={loading} // Disable button while loading
          >
            {loading ? "Approving..." : "Approve"}{" "}
            {/* Show loading text or spinner */}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

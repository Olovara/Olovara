"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Application {
  id: string;
  userId: string;
  username: string;
  email: string;
  craftingProcess: string;
  portfolio: string;
  interestInJoining: string;
  applicationApproved: boolean;
}

export function ApplicationActions({
  application,
}: {
  application: Application;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  if (!application) {
    return null;
  }

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

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
        setSuccess(true);
        setIsOpen(false);
      }
    } catch (error) {
      setError("Error during approval");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/applications/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          applicationId: application.id,
          rejectionReason: rejectionReason.trim() || undefined
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to reject application");
      } else {
        setSuccess(false);
        setIsOpen(false);
        setIsRejectDialogOpen(false);
        setRejectionReason("");
      }
    } catch (error) {
      setError("Error during rejection");
    } finally {
      setLoading(false);
    }
  };

  const openRejectDialog = () => {
    setIsRejectDialogOpen(true);
  };

  return (
    <>
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
              <strong>Interest in Joining:</strong> {application.interestInJoining || "N/A"}
            </div>
          </div>

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
              onClick={openRejectDialog}
              disabled={loading}
            >
              Reject
            </Button>
            <Button
              onClick={handleApprove}
              disabled={loading}
            >
              {loading ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this seller application? 
              You can provide a reason for the rejection (optional).
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason (Optional)
              </label>
              <Textarea
                id="rejection-reason"
                placeholder="Provide a reason for rejection to help the applicant understand the decision..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full"
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm">
                {error}
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setRejectionReason("");
                setError(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Rejecting..." : "Reject Application"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

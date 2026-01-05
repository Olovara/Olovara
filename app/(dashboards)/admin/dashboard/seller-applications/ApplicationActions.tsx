"use client";

import { useState } from "react";
import Image from "next/image";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Application {
  id: string;
  userId: string;
  username: string;
  email: string;
  craftingProcess: string;
  productTypes: string;
  interestInJoining: string;
  // Simplified fields for enhanced application review
  onlinePresence?: string;
  yearsOfExperience?: string;
  birthdate?: string;
  agreeToHandmadePolicy?: boolean;
  certifyOver18?: boolean;
  agreeToTerms?: boolean;
  applicationApproved: boolean;
  // Verification photos
  productPhoto?: string | null;
  workstationPhoto?: string | null;
}

export function ApplicationActions({
  application,
}: {
  application: Application;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isRequestInfoDialogOpen, setIsRequestInfoDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  if (!application) {
    return null;
  }

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const logContext = {
      applicationId: application.id,
      sellerEmail: application.email,
      timestamp: new Date().toISOString(),
    };

    console.log(`[CLIENT] Starting approval process`, logContext);

    // Retry logic: attempt up to 3 times with exponential backoff
    const maxRetries = 3;
    let lastError: string | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[CLIENT] Approval attempt ${attempt}/${maxRetries}`, {
          ...logContext,
          attempt,
        });

        const response = await fetch("/api/applications/approve", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ applicationId: application.id }),
        });

        if (!response.ok) {
          const data = await response.json();
          lastError = data.error || "Failed to approve application";

          console.warn(`[CLIENT] Approval attempt ${attempt} failed`, {
            ...logContext,
            attempt,
            status: response.status,
            error: lastError,
          });

          // If it's a client error (4xx), don't retry - it's a permanent failure
          if (response.status >= 400 && response.status < 500) {
            console.error(`[CLIENT] Client error - not retrying`, {
              ...logContext,
              attempt,
              status: response.status,
              error: lastError,
            });
            setError(lastError);
            setLoading(false);
            return;
          }

          // For server errors (5xx) or network errors, retry
          if (attempt < maxRetries) {
            const backoffMs = Math.pow(2, attempt - 1) * 1000;
            console.log(`[CLIENT] Retrying after ${backoffMs}ms`, {
              ...logContext,
              attempt,
              backoffMs,
            });
            // Exponential backoff: wait 1s, 2s, 4s
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            continue;
          }
        } else {
          // Success!
          console.log(`[CLIENT] Approval succeeded`, {
            ...logContext,
            attempt,
          });
          setSuccess(true);
          setIsOpen(false);
          setLoading(false);
          // Refresh the page to show updated application status
          setTimeout(() => {
            window.location.reload();
          }, 500);
          return;
        }
      } catch (error) {
        lastError = "Network error during approval";

        console.error(`[CLIENT] Approval attempt ${attempt} exception`, {
          ...logContext,
          attempt,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });

        // Retry on network errors
        if (attempt < maxRetries) {
          const backoffMs = Math.pow(2, attempt - 1) * 1000;
          console.log(`[CLIENT] Retrying after ${backoffMs}ms`, {
            ...logContext,
            attempt,
            backoffMs,
          });
          // Exponential backoff: wait 1s, 2s, 4s
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue;
        }
      }
    }

    // If we get here, all retries failed
    console.error(`[CLIENT] All approval attempts failed`, {
      ...logContext,
      maxRetries,
      finalError: lastError,
    });
    setError(
      lastError ||
        "Failed to approve application after multiple attempts. Please try again."
    );
    setLoading(false);
  };

  const handleReject = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Retry logic: attempt up to 3 times with exponential backoff
    const maxRetries = 3;
    let lastError: string | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch("/api/applications/reject", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            applicationId: application.id,
            rejectionReason: rejectionReason.trim() || undefined,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          lastError = data.error || "Failed to reject application";

          // If it's a client error (4xx), don't retry - it's a permanent failure
          if (response.status >= 400 && response.status < 500) {
            setError(lastError);
            setLoading(false);
            return;
          }

          // For server errors (5xx) or network errors, retry
          if (attempt < maxRetries) {
            // Exponential backoff: wait 1s, 2s, 4s
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, attempt - 1) * 1000)
            );
            continue;
          }
        } else {
          // Success!
          setSuccess(false);
          setIsOpen(false);
          setIsRejectDialogOpen(false);
          setRejectionReason("");
          setLoading(false);
          // Refresh the page to show updated application status
          setTimeout(() => {
            window.location.reload();
          }, 500);
          return;
        }
      } catch (error) {
        lastError = "Network error during rejection";

        // Retry on network errors
        if (attempt < maxRetries) {
          // Exponential backoff: wait 1s, 2s, 4s
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt - 1) * 1000)
          );
          continue;
        }
      }
    }

    // If we get here, all retries failed
    setError(
      lastError ||
        "Failed to reject application after multiple attempts. Please try again."
    );
    setLoading(false);
  };

  const openRejectDialog = () => {
    setIsRejectDialogOpen(true);
  };

  // Handle requesting additional information from seller
  // NOTE: This ONLY sends an email - it does NOT approve or reject the application
  const handleRequestInformation = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Retry logic: attempt up to 3 times with exponential backoff
    const maxRetries = 3;
    let lastError: string | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch("/api/applications/request-information", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            applicationId: application.id,
            requestMessage: requestMessage.trim(),
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          lastError = data.error || "Failed to send information request";

          // If it's a client error (4xx), don't retry - it's a permanent failure
          if (response.status >= 400 && response.status < 500) {
            setError(lastError);
            setLoading(false);
            return;
          }

          // For server errors (5xx) or network errors, retry
          if (attempt < maxRetries) {
            // Exponential backoff: wait 1s, 2s, 4s
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, attempt - 1) * 1000)
            );
            continue;
          }
        } else {
          // Success! Email sent - no need to reload since we're not changing application status
          setSuccess(true);
          setIsRequestInfoDialogOpen(false);
          setRequestMessage("");
          setLoading(false);
          return;
        }
      } catch (error) {
        lastError = "Network error during information request";

        // Retry on network errors
        if (attempt < maxRetries) {
          // Exponential backoff: wait 1s, 2s, 4s
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt - 1) * 1000)
          );
          continue;
        }
      }
    }

    // If we get here, all retries failed
    setError(
      lastError ||
        "Failed to send information request after multiple attempts. Please try again."
    );
    setLoading(false);
  };

  // Helper function to check if this is a legacy application
  const isLegacyApplication =
    !application.onlinePresence ||
    application.onlinePresence === "Legacy Application";

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">View</Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Seller Application Review</DialogTitle>
            <DialogDescription>
              Detailed information about the seller&apos;s application.
              {isLegacyApplication && (
                <Badge variant="secondary" className="ml-2">
                  Legacy Application
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong className="text-sm text-gray-600">Username:</strong>
                  <p className="mt-1">{application.username || "N/A"}</p>
                </div>
                <div>
                  <strong className="text-sm text-gray-600">Email:</strong>
                  <p className="mt-1">{application.email || "N/A"}</p>
                </div>
                <div>
                  <strong className="text-sm text-gray-600">
                    Online Presence:
                  </strong>
                  <p className="mt-1">{application.onlinePresence || "N/A"}</p>
                </div>
                <div>
                  <strong className="text-sm text-gray-600">
                    Years of Experience:
                  </strong>
                  <p className="mt-1">
                    {application.yearsOfExperience || "N/A"}
                  </p>
                </div>
                <div>
                  <strong className="text-sm text-gray-600">
                    Date of Birth:
                  </strong>
                  <p className="mt-1">{application.birthdate || "N/A"}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Crafting Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Crafting Information
              </h3>
              <div className="space-y-4">
                <div>
                  <strong className="text-sm text-gray-600">
                    Crafting Process:
                  </strong>
                  <p className="mt-1 text-sm">
                    {application.craftingProcess || "N/A"}
                  </p>
                </div>
                <div>
                  <strong className="text-sm text-gray-600">
                    Product Types:
                  </strong>
                  <p className="mt-1 text-sm">
                    {application.productTypes || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Motivation */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Why Join Yarnnu?
              </h3>
              <div>
                <strong className="text-sm text-gray-600">
                  Interest in Joining:
                </strong>
                <p className="mt-1 text-sm">
                  {application.interestInJoining || "N/A"}
                </p>
              </div>
            </div>

            <Separator />

            {/* Handmade Verification Photos */}
            {(application.productPhoto || application.workstationPhoto) && (
              <>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Handmade Verification Photos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {application.productPhoto && (
                      <div className="space-y-2">
                        <strong className="text-sm text-gray-600">
                          Product Photo:
                        </strong>
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-200">
                          <Image
                            src={application.productPhoto}
                            alt="Product verification photo"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      </div>
                    )}
                    {application.workstationPhoto && (
                      <div className="space-y-2">
                        <strong className="text-sm text-gray-600">
                          Workstation Photo:
                        </strong>
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-200">
                          <Image
                            src={application.workstationPhoto}
                            alt="Workstation verification photo"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Legal Agreements */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Legal Agreements
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-4 h-4 rounded ${application.certifyOver18 ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                  <span className="text-sm">Certified 18+ years old</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-4 h-4 rounded ${application.agreeToHandmadePolicy ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                  <span className="text-sm">Agreed to Handmade Policy</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-4 h-4 rounded ${application.agreeToTerms ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                  <span className="text-sm">Agreed to Terms & Conditions</span>
                </div>
              </div>
            </div>

            {/* Scammer Detection Warnings */}
            {!isLegacyApplication && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Scammer Detection
                  </h3>
                  <div className="space-y-2 text-sm">
                    {!application.onlinePresence && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                        ⚠️ No online presence (portfolio/shop links) provided
                      </div>
                    )}
                    {application.craftingProcess.length < 50 && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                        ⚠️ Very short crafting process description
                      </div>
                    )}
                    {application.productTypes &&
                      application.productTypes.length < 20 && (
                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                          ⚠️ Very short product types description
                        </div>
                      )}
                  </div>
                </div>
              </>
            )}
          </div>

          {success !== null && (
            <div
              className={`mt-4 p-3 rounded ${success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}
            >
              {success ? "Application approved!" : "Application rejected!"}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRequestInfoDialogOpen(true)}
              disabled={loading}
            >
              Request Information
            </Button>
            <Button
              variant="outline"
              onClick={openRejectDialog}
              disabled={loading}
            >
              Reject
            </Button>
            <Button onClick={handleApprove} disabled={loading}>
              {loading ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this seller application? You can
              provide a reason for the rejection (optional).
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="rejection-reason"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
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

            {error && <div className="text-red-500 text-sm">{error}</div>}
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

      {/* Request Information Dialog */}
      <Dialog
        open={isRequestInfoDialogOpen}
        onOpenChange={setIsRequestInfoDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Additional Information</DialogTitle>
            <DialogDescription>
              Send an email to {application.email || application.username}{" "}
              requesting additional information about their seller application.
              The email will be sent from support@yarnnu.com.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="request-message"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                What information do you need? (e.g., &quot;Please provide images
                or proof that you sell handmade items&quot;)
              </label>
              <Textarea
                id="request-message"
                placeholder="Example: We noticed you don't have any social media links. Could you please provide images or proof that you sell handmade items? This could include photos of your workspace, products in progress, or links to your portfolio."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows={6}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This message will be sent directly to the seller via email.
              </p>
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            {success && (
              <div className="text-green-500 text-sm">
                Information request email sent successfully!
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRequestMessage("");
                setError(null);
                setIsRequestInfoDialogOpen(false);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestInformation}
              disabled={loading || !requestMessage.trim()}
            >
              {loading ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

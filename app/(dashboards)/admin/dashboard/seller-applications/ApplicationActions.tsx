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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Application {
  id: string;
  userId: string;
  username: string;
  email: string;
  craftingProcess: string;
  portfolio: string;
  interestInJoining: string;
  // New fields for enhanced application review
  websiteOrShopLinks?: string;
  socialMediaProfiles?: string;
  location?: string;
  yearsOfExperience?: string;
  productTypes?: string;
  birthdate?: string;
  agreeToHandmadePolicy?: boolean;
  certifyOver18?: boolean;
  agreeToTerms?: boolean;
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

  // Helper function to check if this is a legacy application
  const isLegacyApplication = !application.websiteOrShopLinks || application.websiteOrShopLinks === "Legacy Application";

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
                <Badge variant="secondary" className="ml-2">Legacy Application</Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
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
                  <strong className="text-sm text-gray-600">Location:</strong>
                  <p className="mt-1">{application.location || "N/A"}</p>
                </div>
                <div>
                  <strong className="text-sm text-gray-600">Years of Experience:</strong>
                  <p className="mt-1">{application.yearsOfExperience || "N/A"}</p>
                </div>
                <div>
                  <strong className="text-sm text-gray-600">Date of Birth:</strong>
                  <p className="mt-1">{application.birthdate || "N/A"}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Crafting Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Crafting Information</h3>
              <div className="space-y-4">
                <div>
                  <strong className="text-sm text-gray-600">Crafting Process:</strong>
                  <p className="mt-1 text-sm">{application.craftingProcess || "N/A"}</p>
                </div>
                <div>
                  <strong className="text-sm text-gray-600">Product Types:</strong>
                  <p className="mt-1 text-sm">{application.productTypes || "N/A"}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Online Presence */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Online Presence</h3>
              <div className="space-y-4">
                <div>
                  <strong className="text-sm text-gray-600">Portfolio/Shop Links:</strong>
                  <p className="mt-1 text-sm">
                    {application.portfolio ? (
                      <a href={application.portfolio} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {application.portfolio}
                      </a>
                    ) : "N/A"}
                  </p>
                </div>
                <div>
                  <strong className="text-sm text-gray-600">Website/Shop Links:</strong>
                  <p className="mt-1 text-sm">
                    {application.websiteOrShopLinks ? (
                      <a href={application.websiteOrShopLinks} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {application.websiteOrShopLinks}
                      </a>
                    ) : "N/A"}
                  </p>
                </div>
                <div>
                  <strong className="text-sm text-gray-600">Social Media Profiles:</strong>
                  <p className="mt-1 text-sm">
                    {application.socialMediaProfiles ? (
                      <a href={application.socialMediaProfiles} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {application.socialMediaProfiles}
                      </a>
                    ) : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Motivation */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Why Join Yarnnu?</h3>
              <div>
                <strong className="text-sm text-gray-600">Interest in Joining:</strong>
                <p className="mt-1 text-sm">{application.interestInJoining || "N/A"}</p>
              </div>
            </div>

            <Separator />

            {/* Legal Agreements */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Legal Agreements</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded ${application.certifyOver18 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm">Certified 18+ years old</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded ${application.agreeToHandmadePolicy ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm">Agreed to Handmade Policy</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded ${application.agreeToTerms ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm">Agreed to Terms & Conditions</span>
                </div>
              </div>
            </div>

            {/* Scammer Detection Warnings */}
            {!isLegacyApplication && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Scammer Detection</h3>
                  <div className="space-y-2 text-sm">
                    {!application.websiteOrShopLinks && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                        ⚠️ No website/shop links provided
                      </div>
                    )}
                    {!application.socialMediaProfiles && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                        ⚠️ No social media profiles provided
                      </div>
                    )}
                    {application.craftingProcess.length < 50 && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                        ⚠️ Very short crafting process description
                      </div>
                    )}
                    {application.productTypes && application.productTypes.length < 20 && (
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
            <div className={`mt-4 p-3 rounded ${success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
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

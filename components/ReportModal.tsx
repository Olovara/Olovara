"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Flag, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportType: "SELLER" | "PRODUCT";
  targetId: string;
  targetName: string;
}

const REPORT_CATEGORIES = {
  INAPPROPRIATE_CONTENT: {
    label: "Inappropriate Content",
    description: "Content that violates community guidelines",
    severity: "HIGH"
  },
  COPYRIGHT_INFRINGEMENT: {
    label: "Copyright Infringement",
    description: "Unauthorized use of copyrighted material",
    severity: "HIGH"
  },
  MISLEADING_INFORMATION: {
    label: "Misleading Information",
    description: "False or deceptive product descriptions",
    severity: "MEDIUM"
  },
  POOR_QUALITY: {
    label: "Poor Quality",
    description: "Products that don't meet quality standards",
    severity: "MEDIUM"
  },
  FAKE_PRODUCTS: {
    label: "Fake/Counterfeit Products",
    description: "Products that are not authentic",
    severity: "CRITICAL"
  },
  HARASSMENT: {
    label: "Harassment",
    description: "Bullying, threats, or abusive behavior",
    severity: "CRITICAL"
  },
  SPAM: {
    label: "Spam",
    description: "Excessive promotional content or unwanted messages",
    severity: "LOW"
  },
  OTHER: {
    label: "Other",
    description: "Other issues not covered above",
    severity: "MEDIUM"
  }
};

const SUB_REASONS = {
  INAPPROPRIATE_CONTENT: [
    "Explicit content",
    "Violence",
    "Hate speech",
    "Discrimination",
    "Adult content"
  ],
  COPYRIGHT_INFRINGEMENT: [
    "Unauthorized brand use",
    "Stolen designs",
    "Trademark violation",
    "Patent infringement"
  ],
  MISLEADING_INFORMATION: [
    "False product claims",
    "Misleading images",
    "Incorrect materials",
    "Fake reviews"
  ],
  POOR_QUALITY: [
    "Defective items",
    "Poor craftsmanship",
    "Incorrect sizing",
    "Damaged goods"
  ],
  FAKE_PRODUCTS: [
    "Counterfeit items",
    "Knock-off products",
    "Fake designer goods",
    "Unauthorized replicas"
  ],
  HARASSMENT: [
    "Bullying",
    "Threats",
    "Abusive language",
    "Stalking behavior"
  ],
  SPAM: [
    "Excessive messaging",
    "Unwanted promotions",
    "Bot activity",
    "Repeated content"
  ],
  OTHER: [
    "Policy violation",
    "Safety concern",
    "Legal issue",
    "Other"
  ]
};

export default function ReportModal({ 
  open, 
  onOpenChange, 
  reportType, 
  targetId, 
  targetName 
}: ReportModalProps) {
  const [category, setCategory] = useState<string>("");
  const [subReason, setSubReason] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [evidence, setEvidence] = useState<string>("");
  const [reporterName, setReporterName] = useState<string>("");
  const [reporterEmail, setReporterEmail] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !description.trim()) {
      toast.error("Please select a category and provide a description");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportType,
          targetId,
          targetName,
          category,
          subReason: subReason || undefined,
          description: description.trim(),
          evidence: evidence.trim() || undefined,
          reporterName: reporterName.trim() || undefined,
          reporterEmail: reporterEmail.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit report");
      }

      setIsSubmitted(true);
      toast.success("Report submitted successfully");
      
      // Close modal after a short delay
      setTimeout(() => {
        onOpenChange(false);
        setIsSubmitted(false);
        // Reset form
        setCategory("");
        setSubReason("");
        setDescription("");
        setEvidence("");
        setReporterName("");
        setReporterEmail("");
      }, 2000);

    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setSubReason(""); // Reset sub-reason when category changes
  };

  if (isSubmitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Report Submitted
            </DialogTitle>
            <DialogDescription>
              Thank you for your report. Our team will review it and take appropriate action if necessary.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-600" />
            Report {reportType === "SELLER" ? "Seller" : "Product"}
          </DialogTitle>
          <DialogDescription>
            Help us maintain a safe and quality marketplace by reporting issues with{" "}
            <span className="font-medium">{targetName}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">Report Category *</Label>
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REPORT_CATEGORIES).map(([key, category]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex flex-col">
                      <span className="font-medium">{category.label}</span>
                      <span className="text-xs text-muted-foreground">{category.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sub-reason Selection */}
          {category && SUB_REASONS[category as keyof typeof SUB_REASONS] && (
            <div className="space-y-2">
              <Label htmlFor="subReason">Specific Issue (Optional)</Label>
              <Select value={subReason} onValueChange={setSubReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select specific issue" />
                </SelectTrigger>
                <SelectContent>
                  {SUB_REASONS[category as keyof typeof SUB_REASONS].map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              id="description"
              placeholder="Please provide a detailed description of the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>

          {/* Evidence */}
          <div className="space-y-2">
            <Label htmlFor="evidence">Additional Evidence (Optional)</Label>
            <Textarea
              id="evidence"
              placeholder="Any additional evidence, links, or context that supports your report..."
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              rows={3}
            />
          </div>

          {/* Contact Information (Optional) */}
          <div className="space-y-2">
            <Label>Contact Information (Optional)</Label>
            <p className="text-sm text-muted-foreground">
              Provide your contact information if you&apos;d like us to follow up with you about this report.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Your name"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
              />
              <Input
                type="email"
                placeholder="Your email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Severity Alert */}
          {category && REPORT_CATEGORIES[category as keyof typeof REPORT_CATEGORIES] && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This report has been classified as{" "}
                <span className="font-medium">
                  {REPORT_CATEGORIES[category as keyof typeof REPORT_CATEGORIES].severity}
                </span>{" "}
                priority and will be reviewed accordingly.
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
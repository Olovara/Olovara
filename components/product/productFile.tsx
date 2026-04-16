"use client";

import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { X, Upload } from "lucide-react";
import { Form, UseFormReturn } from "react-hook-form";
import { useRef } from "react";
import { Input } from "@/components/ui/input";

// Type for processed file data (similar to ProcessedImage)
export type ProcessedFile = {
  id: string; // Unique ID for this file
  file: File; // The file ready for upload
  preview: string; // File name or preview URL
  originalName: string; // Original filename
};

type ProductFileProps = {
  form: UseFormReturn<any>;
  processedFile?: ProcessedFile | null; // Store the file object instead of URL
  setProcessedFile?: (file: ProcessedFile | null) => void;
  existingFileUrl?: string | null; // URL of already uploaded file (for editing)
};

export function ProductFileSection({
  form,
  processedFile,
  setProcessedFile,
  existingFileUrl,
}: ProductFileProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentFileUrl = form.watch("productFile"); // This will be the URL (existing or to be set after upload)

  // Determine if we have a file to show (either existing URL or new processed file)
  const hasFile = currentFileUrl || processedFile || existingFileUrl;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (PDF only based on the upload endpoint)
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    // Validate file size (check if there's a max size limit)
    const maxSize = 16 * 1024 * 1024; // 16MB
    if (file.size > maxSize) {
      toast.error("File size must be less than 16MB");
      return;
    }

    // Create ProcessedFile object (similar to ProcessedImage)
    const newProcessedFile: ProcessedFile = {
      id: `processed-file-${Date.now()}-${Math.random()}`,
      file: file,
      preview: file.name, // Use file name as preview
      originalName: file.name,
    };

    // Store the processed file (will be uploaded later in onSubmit)
    if (setProcessedFile) {
      setProcessedFile(newProcessedFile);
    }

    // Set a temporary preview URL in the form (blob URL for display)
    const previewUrl = URL.createObjectURL(file);
    form.setValue("productFile", previewUrl, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    toast.success(
      "File selected. It will be uploaded when you save the product."
    );
  };

  const handleRemoveFile = () => {
    // If there's a processed file (new file), remove it
    if (processedFile) {
      // Revoke the blob URL to prevent memory leaks
      const currentValue = form.getValues("productFile");
      if (currentValue && currentValue.startsWith("blob:")) {
        URL.revokeObjectURL(currentValue);
      }

      if (setProcessedFile) {
        setProcessedFile(null);
      }
    }

    // If there's an existing file URL, we still need to clean it up on the server
    // But only if the product was already created (we'll handle this in cleanup)
    const fileToCleanup = existingFileUrl || currentFileUrl;
    if (fileToCleanup && fileToCleanup.startsWith("http")) {
      // This is an existing uploaded file - we'll clean it up in the cleanup action
      // For now, just remove it from the form
    }

    // Clear the form value
    form.setValue("productFile", null, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    toast.success("File removed");
  };

  // Display the file name (either from processed file or existing URL)
  const getFileName = () => {
    if (processedFile) {
      return processedFile.originalName;
    }
    if (existingFileUrl || currentFileUrl) {
      // Extract filename from URL or use a generic name
      const url = existingFileUrl || currentFileUrl;
      if (url.startsWith("blob:")) {
        return "Selected file";
      }
      // Try to extract filename from URL
      const urlParts = url.split("/");
      return urlParts[urlParts.length - 1] || "Product file";
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-y-4">
      {/* For digital product file upload */}
      {form.watch("isDigital") && (
        <div className="flex flex-col gap-y-2">
          <Label>Product File</Label>

          {hasFile ? (
            <div className="flex items-center gap-x-2">
              <span className="text-sm text-muted-foreground truncate flex-1">
                {existingFileUrl && !processedFile ? (
                  <>
                    Current file:{" "}
                    <span className="font-medium">{getFileName()}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      (Already uploaded)
                    </span>
                  </>
                ) : (
                  <>
                    Selected file:{" "}
                    <span className="font-medium">{getFileName()}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      (Will upload on save)
                    </span>
                  </>
                )}
              </span>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleRemoveFile}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="product-file-input"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Select PDF File
              </Button>
              <p className="text-xs text-muted-foreground">
                File will be uploaded when you save the product
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

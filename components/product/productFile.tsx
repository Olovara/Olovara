"use client";

import { UploadDropzone } from "@/lib/uploadthing";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Form, UseFormReturn } from "react-hook-form";

type ProductFileProps = {
  form: UseFormReturn<any>;
  tempFiles?: string[];
  setTempFiles?: (files: string[]) => void;
  setTempUploadsCreated?: (created: boolean) => void;
};

export function ProductFileSection({
  form,
  tempFiles = [],
  setTempFiles = (files: string[]) => {},
  setTempUploadsCreated,
}: ProductFileProps) {
  const currentFile = form.watch("productFile");

  const handleRemoveFile = () => {
    if (currentFile) {
      // Clean up the file from storage, regardless of whether it's temp or not
      fetch("/api/upload/cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files: [currentFile] }),
      }).catch(console.error);

      // If it was a temp file, remove from temp state
      if (tempFiles.includes(currentFile)) {
        const updatedFiles = tempFiles.filter(
          (file: string) => file !== currentFile
        );
        setTempFiles(updatedFiles);
      }

      // Clear the form value and mark as dirty
      form.setValue("productFile", null, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  };

  return (
    <div className="flex flex-col gap-y-4">
      {/* For digital product file upload */}
      {form.watch("isDigital") && (
        <div className="flex flex-col gap-y-2">
          <Label>Product File</Label>

          {currentFile ? (
            <div className="flex items-center gap-x-2">
              <span className="text-sm text-muted-foreground truncate">
                Current file: {currentFile}
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
            <UploadDropzone
              endpoint="productFileUpload"
              onClientUploadComplete={(res) => {
                if (res && res.length > 0) {
                  const fileUrl = res[0].url || res[0].ufsUrl;
                  const updatedFiles = [...tempFiles, fileUrl];

                  // Update both states
                  setTempFiles(updatedFiles);
                  form.setValue("productFile", fileUrl, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });

                  // Mark that temporary uploads have been created
                  if (setTempUploadsCreated) {
                    setTempUploadsCreated(true);
                  }

                  toast.success("Your product file has been uploaded!");
                }
              }}
              onUploadError={(error: Error) => {
                toast.error("Something went wrong, try again");
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { UploadDropzone } from "@/lib/uploadthing";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ProductFileSection = ({ form }) => {
  return (
    <div className="flex flex-col gap-y-4">
      {/* For digital product file upload */}
      {form.watch("isDigital") && (
        <div className="flex flex-col gap-y-2">
          <Label>Product File</Label>

          <UploadDropzone
            endpoint="productFileUpload"
            onClientUploadComplete={(res) => {
              if (res && res.length > 0) {
                const fileUrl = res[0].url;
                form.setValue("productFile", fileUrl, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true
                });
                toast.success("Your product file has been uploaded!");
              } else {
                toast.error("No file uploaded. Please try again.");
              }
            }}
            onUploadError={(error) => {
              console.error("Error uploading file:", error);
              toast.error("Something went wrong, try again.");
            }}
          />
          
          {/* Show current file if it exists */}
          {form.watch("productFile") && (
            <div className="text-sm text-muted-foreground">
              Current file: {form.watch("productFile")}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductFileSection;

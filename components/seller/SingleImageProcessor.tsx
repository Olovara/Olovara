"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Cropper, CropperRef, ImageRestriction } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { X, Upload } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

// Type for processed image data
export type SingleProcessedImage = {
  file: File; // The processed file ready for upload
  preview: string; // Data URL for preview
  originalName: string; // Original filename
};

type SingleImageProcessorProps = {
  onImageProcessed: (image: SingleProcessedImage | null) => void; // Callback when image is ready
  existingImage?: string; // URL of already uploaded image (for editing)
  aspectRatio?: number; // Aspect ratio for cropping (width/height), e.g., 1 for square, 16/9 for wide
  label?: string; // Label for the image input
  description?: string; // Description text
  previewClassName?: string; // Custom className for preview
};

export function SingleImageProcessor({
  onImageProcessed,
  existingImage,
  aspectRatio = 1, // Default to square
  label = "Image",
  description,
  previewClassName = "w-24 h-24 rounded object-cover",
}: SingleImageProcessorProps) {
  const [processedImage, setProcessedImage] =
    useState<SingleProcessedImage | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [currentCropFile, setCurrentCropFile] = useState<File | null>(null);
  const [savedCoordinates, setSavedCoordinates] = useState<any>(null);

  const cropperRef = useRef<CropperRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inject CSS to prevent cropper overflow
  useEffect(() => {
    const styleId = "cropper-modal-fix-single";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .cropper-container,
        .cropper-canvas-container,
        .cropper-image-container,
        .cropper-area {
          max-width: 100% !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        [data-radix-dialog-content] .cropper-container {
          max-width: 100% !important;
          overflow: hidden !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Notify parent when processed image changes
  // Note: We don't auto-notify on mount to avoid clearing existing images
  // The parent will handle existing images separately
  useEffect(() => {
    if (processedImage) {
      onImageProcessed(processedImage);
    }
    // Don't notify null on mount or when processedImage is cleared unless explicitly removed
  }, [processedImage, onImageProcessed]);

  // Handle file selection
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);

      // Filter to only image files
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));

      if (imageFiles.length === 0) {
        toast.error("Please select an image file");
        return;
      }

      // Start processing first image
      if (imageFiles.length > 0) {
        setCurrentCropFile(imageFiles[0]);
        setIsCropping(true);
        setSavedCoordinates(null); // Reset saved coordinates
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    []
  );

  // Get cropped image from cropper
  const getCroppedImage = useCallback(async (): Promise<File | null> => {
    if (!cropperRef.current || !currentCropFile) {
      return null;
    }

    const canvas = cropperRef.current.getCanvas();
    if (!canvas) {
      toast.error("Failed to get cropped image");
      return null;
    }

    // Save coordinates for restoration
    try {
      const coordinates = cropperRef.current.getCoordinates();
      if (coordinates) {
        setSavedCoordinates(coordinates);
      }
    } catch (error) {
      console.warn("Could not save coordinates:", error);
    }

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const croppedFile = new File([blob], currentCropFile.name, {
            type: currentCropFile.type,
            lastModified: Date.now(),
          });
          resolve(croppedFile);
        },
        currentCropFile.type,
        0.95 // Quality
      );
    });
  }, [currentCropFile]);

  // Restore crop coordinates when cropper is ready
  useEffect(() => {
    if (cropperRef.current && savedCoordinates && currentCropFile) {
      const timeoutId = setTimeout(() => {
        if (cropperRef.current) {
          try {
            cropperRef.current.setCoordinates(savedCoordinates);
          } catch (error) {
            console.warn("Could not restore coordinates:", error);
          }
        }
      }, 150);

      return () => clearTimeout(timeoutId);
    }
  }, [savedCoordinates, currentCropFile, isCropping]);

  // Process current image: crop only (WebP compression runs in uploadProcessedImages)
  const processCurrentImage = useCallback(async () => {
    if (!currentCropFile) return;

    try {
      // Step 1: Get cropped image
      let processedFile = await getCroppedImage();
      if (!processedFile) {
        toast.error("Failed to crop image");
        return;
      }

      // Step 2: Create preview
      const preview = URL.createObjectURL(processedFile);

      // Step 3: Set processed image
      const newProcessedImage: SingleProcessedImage = {
        file: processedFile,
        preview,
        originalName: currentCropFile.name,
      };

      setProcessedImage(newProcessedImage);
      setIsCropping(false);
      setCurrentCropFile(null);
      toast.success("Image processed successfully");
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to process image");
    }
  }, [currentCropFile, getCroppedImage]);

  // Remove processed image or existing image
  const removeImage = useCallback(() => {
    if (processedImage) {
      URL.revokeObjectURL(processedImage.preview); // Clean up object URL
    }
    setProcessedImage(null);
    // Always notify parent that image is removed (whether it was processed or existing)
    onImageProcessed(null);
  }, [processedImage, onImageProcessed]);

  // Determine which image to show (existing, processed, or placeholder)
  // If there's a processed image, it takes priority (user is replacing existing)
  const displayImage =
    processedImage?.preview || (existingImage ? existingImage : null);
  const isExistingImage = existingImage && !processedImage;

  return (
    <div className="flex flex-col gap-y-2">
      <Label>{label}</Label>

      <div className="flex items-center gap-4">
        {/* Image Preview */}
        {displayImage ? (
          <div className="relative">
            <Image
              src={displayImage}
              alt={label}
              width={80}
              height={80}
              className={previewClassName}
            />
            {isExistingImage && (
              <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 rounded">
                Saved
              </div>
            )}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 w-6 h-6 p-0"
              onClick={removeImage}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div
            className={`${previewClassName} border-2 border-dashed border-gray-300 flex items-center justify-center`}
          >
            <Upload className="h-6 w-6 text-gray-400" />
          </div>
        )}

        {/* File Input */}
        <div className="flex-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            {displayImage ? "Change Image" : "Select Image"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>

      {/* Cropping Dialog */}
      <Dialog
        open={isCropping}
        onOpenChange={(open) => {
          if (!open) {
            // Cancel cropping - close dialog and reset
            setCurrentCropFile(null);
            setIsCropping(false);
            setSavedCoordinates(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-full overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>Crop {label}</DialogTitle>
          </DialogHeader>

          {currentCropFile && (
            <div
              className="space-y-4 w-full max-w-full"
              style={{ minWidth: 0 }}
            >
              <div
                className="relative w-full h-[400px] bg-gray-100 rounded-lg overflow-hidden"
                style={{
                  minWidth: 0,
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  position: "relative",
                }}
              >
                <Cropper
                  key={`cropper-${currentCropFile.name}`}
                  ref={cropperRef}
                  src={URL.createObjectURL(currentCropFile)}
                  className="cropper"
                  style={{
                    width: "100%",
                    height: "100%",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                  }}
                  stencilProps={{
                    aspectRatio: aspectRatio, // Use provided aspect ratio
                  }}
                  imageRestriction={ImageRestriction.stencil}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCurrentCropFile(null);
                  setIsCropping(false);
                  setSavedCoordinates(null);
                }}
              >
                Cancel
              </Button>
              <Button type="button" onClick={processCurrentImage}>
                Process Image
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

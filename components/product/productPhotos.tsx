"use client";

import { Label } from "@/components/ui/label";
import { Dispatch, SetStateAction, useCallback, useRef } from "react";
import { ImageProcessor, ProcessedImage } from "./ImageProcessor";
import React from "react";

type ProductPhotosProps = {
  images: string[];
  setImages: Dispatch<SetStateAction<string[]>>;
  tempImages: string[];
  setTempImages: Dispatch<SetStateAction<string[]>>;
  form: any;
  setTempUploadsCreated?: (created: boolean) => void;
  // New prop to store processed images before upload
  setProcessedImages?: Dispatch<SetStateAction<ProcessedImage[]>>;
  // Previously processed images to restore in ImageProcessor
  processedImages?: ProcessedImage[];
};

export function ProductPhotosSection({
  images,
  setImages,
  tempImages,
  setTempImages,
  form,
  setTempUploadsCreated,
  setProcessedImages,
  processedImages = [],
}: ProductPhotosProps) {
  // Track initial existing images (already uploaded HTTP URLs) - stable reference
  // This prevents infinite loops by keeping existingImages stable
  const existingImagesRef = React.useRef<string[]>([]);
  const prevImagesRef = React.useRef<string>("");

  // Extract existing images (HTTP URLs) - only update when images prop changes externally
  // We detect external changes by checking if all images are HTTP URLs (not blob URLs)
  React.useEffect(() => {
    // Don't sort - preserve order
    const currentKey = JSON.stringify(images);
    const prevKey = prevImagesRef.current;

    // Check if this is an external update (all HTTP URLs, no blob URLs)
    const allHttp =
      images.length > 0 &&
      images.every(
        (img) => img.startsWith("http://") || img.startsWith("https://")
      );

    // Only update existing images if:
    // 1. Images changed AND
    // 2. All images are HTTP URLs (external update, not from our processing)
    if (currentKey !== prevKey && allHttp) {
      existingImagesRef.current = [...images];
      prevImagesRef.current = currentKey;
    } else if (currentKey !== prevKey) {
      // Images changed but not all HTTP - update the tracking key
      prevImagesRef.current = currentKey;
    }
  }, [images]);

  const existingImages = existingImagesRef.current;

  // Use ref to track previous processed images to avoid infinite loops
  const prevProcessedRef = React.useRef<string>("");

  // Handle when images are processed (but not yet uploaded)
  const handleImagesProcessed = useCallback(
    (processed: ProcessedImage[]) => {
      console.log('[ProductPhotosSection] handleImagesProcessed CALLED:', {
        processedCount: processed.length,
        processedIds: processed.map(img => img.id),
        processedPreviews: processed.map(img => img.preview.substring(0, 50) + '...'),
        existingCount: processed.filter(img => img.id.startsWith("existing-")).length,
        newCount: processed.filter(img => !img.id.startsWith("existing-")).length
      });
      
      // Create a stable key to compare (preserve order)
      const currentKey = JSON.stringify(
        processed.map((img) => ({ id: img.id, preview: img.preview }))
      );
      const prevKey = prevProcessedRef.current;

      // Only update if something actually changed
      if (currentKey === prevKey) {
        console.log('[ProductPhotosSection] No change detected, skipping update');
        return;
      }

      console.log('[ProductPhotosSection] Change detected, updating parent state');
      prevProcessedRef.current = currentKey;

      // Update form with all image URLs (existing + new previews)
      // Preserve the order from the processed array
      // New images will have blob: URLs, existing will have http URLs
      const allImageUrls = processed.map((img) => img.preview);

      // Update images state with the new order (don't sort, preserve order)
      const currentUrls = JSON.stringify(images);
      const newUrls = JSON.stringify(allImageUrls);
      if (currentUrls !== newUrls) {
        console.log('[ProductPhotosSection] Updating images state:', {
          currentUrlsCount: images.length,
          newUrlsCount: allImageUrls.length
        });
        setImages(allImageUrls);
        form.setValue("images", allImageUrls, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }

      // Store processed images for later upload
      // Separate existing (already uploaded) from new processed images (need to be uploaded)
      // Keep all processed images that aren't already uploaded (existing ones have "existing-" prefix)
      const newProcessedImages = processed.filter(
        (img) => !img.id.startsWith("existing-")
      );
      if (setProcessedImages) {
        console.log('[ProductPhotosSection] UPDATING PARENT processedImages:', {
          newProcessedImagesCount: newProcessedImages.length,
          newProcessedImagesIds: newProcessedImages.map(img => img.id),
          action: 'REPLACING ENTIRE ARRAY',
          stack: new Error().stack?.split('\n').slice(1, 4).join('\n')
        });
        // IMPORTANT: Replace the entire processedImages array instead of merging
        // This ensures that when images are removed, they stay removed
        // The processed array from ImageProcessor contains the current state of all images
        setProcessedImages(newProcessedImages);
      }

      // Update existing images ref if the order changed
      // Extract existing image URLs in the new order
      const newExistingImageUrls = processed
        .filter((img) => img.id.startsWith("existing-"))
        .map((img) => img.preview);
      
      // Only update if the order actually changed
      if (newExistingImageUrls.length > 0) {
        const currentExistingUrls = JSON.stringify(existingImagesRef.current);
        const newExistingUrls = JSON.stringify(newExistingImageUrls);
        if (currentExistingUrls !== newExistingUrls) {
          existingImagesRef.current = newExistingImageUrls;
        }
      }
    },
    [setImages, form, setProcessedImages, images]
  );

  return (
    <ImageProcessor
      onImagesProcessed={handleImagesProcessed}
      existingImages={existingImages}
      maxImages={10}
      initialProcessedImages={processedImages}
    />
  );
}

"use client";

import React, { useState, useRef, useCallback } from "react";
import { Cropper, CropperRef, ImageRestriction } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  X,
  Upload,
  Crop,
  Image as ImageIcon,
  Download,
  ChevronLeft,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { getSellerAbout } from "@/actions/sellerAboutActions";
import { logClientError } from "@/lib/client-error-logger";

// Type for processed image data
export type ProcessedImage = {
  id: string; // Unique ID for this image
  file: File; // The processed file ready for upload
  preview: string; // Data URL for preview
  originalName: string; // Original filename
  originalFileIndex?: number; // Index in fileQueue to track which original file this came from
  uploadSessionId?: string; // Unique ID for the upload session to prevent replacing images from different sessions
};

// Same limit as lib/upload-images.ts and Uploadthing imageUploader (4MB)
const MAX_IMAGE_FILE_SIZE = 4 * 1024 * 1024;

type ImageProcessorProps = {
  onImagesProcessed: (images: ProcessedImage[]) => void; // Callback when images are ready
  existingImages?: string[]; // URLs of already uploaded images (for editing)
  maxImages?: number; // Maximum number of images allowed
  initialProcessedImages?: ProcessedImage[]; // Previously processed images to restore
  onExistingImagesRemoved?: (removedUrls: string[]) => void; // Callback when existing images are removed
};

export function ImageProcessor({
  onImagesProcessed,
  existingImages = [],
  maxImages = 10,
  initialProcessedImages = [],
  onExistingImagesRemoved,
}: ImageProcessorProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  // Initialize with previously processed images from parent
  // Use function initializer to capture initial value and prevent re-initialization
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>(
    () => initialProcessedImages
  );
  const [croppingIndex, setCroppingIndex] = useState<number | null>(null);
  const [currentCropFile, setCurrentCropFile] = useState<File | null>(null);
  // Track all files in the processing queue (for navigation)
  const [fileQueue, setFileQueue] = useState<File[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  // Track unique upload session ID to prevent replacing images from different upload sessions
  const [uploadSessionId, setUploadSessionId] = useState<string | null>(null);

  // Store crop state and watermark settings for each image
  type ImageCropState = {
    coordinates?: any; // Crop coordinates from cropper
    watermarkEnabled: boolean;
    watermarkText: string;
    watermarkOpacity: number[];
    watermarkPosition:
      | "bottom-right"
      | "bottom-left"
      | "top-right"
      | "top-left"
      | "center";
  };
  const [imageStates, setImageStates] = useState<Map<number, ImageCropState>>(
    new Map()
  );

  // Current watermark settings (synced with current image's state)
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [shopName, setShopName] = useState<string>(""); // Seller's shop name
  const [watermarkText, setWatermarkText] = useState("");
  const [watermarkOpacity, setWatermarkOpacity] = useState([20]); // 0-100, default 20%
  const [watermarkPosition, setWatermarkPosition] = useState<
    "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center"
  >("bottom-right");

  // Fetch seller's shop name on mount
  React.useEffect(() => {
    const fetchShopName = async () => {
      try {
        const result = await getSellerAbout();
        if (result.data?.shopName) {
          setShopName(result.data.shopName);
          // Set as default watermark text (will be used when initializing new images)
        }
      } catch (error) {
        console.error("Error fetching shop name:", error);
        logClientError({
          code: "IMAGE_PROCESSOR_SHOP_NAME_FETCH_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch shop name",
          metadata: { component: "ImageProcessor" },
        });
      }
    };
    fetchShopName();
  }, []); // Only run on mount

  // Always keep watermark text synced with shop name (watermark text is read-only now)
  React.useEffect(() => {
    if (shopName) {
      setWatermarkText(shopName);
    }
  }, [shopName]);

  const cropperRef = useRef<CropperRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Track if we're programmatically setting coordinates (to avoid saving during restoration)
  const isRestoringCoordinatesRef = useRef(false);

  // Inject CSS to prevent cropper overflow
  React.useEffect(() => {
    const styleId = "cropper-modal-fix";
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
    return () => {
      // Don't remove on unmount as it might be used by other instances
    };
  }, []);

  // Track if component has mounted - after mount, state is completely independent
  // We NEVER sync from initialProcessedImages after mount to prevent overwriting
  const hasMountedRef = React.useRef(false);
  // Track current processed images in a ref to prevent accidental clearing
  const processedImagesRef = React.useRef<ProcessedImage[]>([]);

  // Sync ref with state and log changes
  React.useEffect(() => {
    const prevCount = processedImagesRef.current.length;
    const newCount = processedImages.length;
    const prevIds = processedImagesRef.current.map((img) => img.id);
    const newIds = processedImages.map((img) => img.id);

    if (
      prevCount !== newCount ||
      JSON.stringify(prevIds) !== JSON.stringify(newIds)
    ) {
      console.log("[ImageProcessor] processedImages STATE CHANGED:", {
        prevCount,
        newCount,
        prevIds,
        newIds,
        added: newIds.filter((id) => !prevIds.includes(id)),
        removed: prevIds.filter((id) => !newIds.includes(id)),
        stack: new Error().stack?.split("\n").slice(1, 4).join("\n"),
      });
    }
    processedImagesRef.current = processedImages;
  }, [processedImages]);

  // Log when initialProcessedImages prop changes
  React.useEffect(() => {
    console.log("[ImageProcessor] initialProcessedImages PROP CHANGED:", {
      count: initialProcessedImages.length,
      ids: initialProcessedImages.map((img) => img.id),
      hasMounted: hasMountedRef.current,
      currentStateCount: processedImagesRef.current.length,
      currentStateIds: processedImagesRef.current.map((img) => img.id),
    });
  }, [initialProcessedImages]);

  // Track removed existing images (URLs that should be deleted from Uploadthing)
  const [removedExistingImages, setRemovedExistingImages] = useState<string[]>([]);

  // Only initialize from initialProcessedImages on first mount
  // After that, processedImages state is completely independent
  React.useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      console.log("[ImageProcessor] COMPONENT MOUNTED:", {
        initialProcessedImagesCount: initialProcessedImages.length,
        initialProcessedImagesIds: initialProcessedImages.map((img) => img.id),
      });
      // On mount, initialize with initialProcessedImages if provided
      // After this, we never touch initialProcessedImages again
      if (initialProcessedImages.length > 0) {
        console.log(
          "[ImageProcessor] Initializing state from initialProcessedImages"
        );
        setProcessedImages(initialProcessedImages);
        processedImagesRef.current = initialProcessedImages;
      } else {
        console.log(
          "[ImageProcessor] No initialProcessedImages, starting with empty state"
        );
      }
    } else {
      console.log(
        "[ImageProcessor] initialProcessedImages changed but component already mounted - IGNORING"
      );
    }
    // After mount, we completely ignore initialProcessedImages prop changes
    // This prevents parent updates from overwriting our newly processed images
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount (intentional: ignore prop changes after mount)

  // Convert existing image URLs to ProcessedImage format (for editing mode)
  // These are already uploaded, so we'll keep them as-is
  // Filter out any that have been removed
  const existingProcessedImages = React.useMemo<ProcessedImage[]>(() => {
    return existingImages
      .filter((url) => !removedExistingImages.includes(url)) // Filter out removed images
      .map((url, index) => ({
        id: `existing-${index}-${url}`,
        file: new File([], `existing-${index}.jpg`), // Dummy file, won't be uploaded
        preview: url, // Use the actual URL for existing images
        originalName: `existing-image-${index + 1}`,
      }));
  }, [existingImages, removedExistingImages]);

  // Handle file selection
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);

      // Filter to only image files
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));

      if (imageFiles.length === 0) {
        toast.error("Please select image files only");
        return;
      }

      // Enforce upload size limit early so seller sees feedback before crop/watermark
      const withinSize = imageFiles.filter((file) => file.size <= MAX_IMAGE_FILE_SIZE);
      const oversized = imageFiles.filter((file) => file.size > MAX_IMAGE_FILE_SIZE);
      if (oversized.length > 0) {
        toast.warning(
          oversized.length === 1
            ? `${oversized[0].name} is over 4MB and was skipped. Use a smaller image.`
            : `${oversized.length} image(s) over 4MB were skipped. Max size per image: 4MB.`
        );
      }
      if (withinSize.length === 0) {
        return;
      }
      const filesToConsider = withinSize;

      // Calculate how many images we can still add
      const currentTotal =
        processedImages.length + existingProcessedImages.length;
      const remainingSlots = maxImages - currentTotal;

      if (remainingSlots <= 0) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }

      // Trim to fit within the max image count limit
      const filesToProcess = filesToConsider.slice(0, remainingSlots);

      if (filesToConsider.length > remainingSlots) {
        toast.warning(
          `Only ${remainingSlots} image${remainingSlots > 1 ? "s" : ""} can be added. ${filesToConsider.length - remainingSlots} image${filesToConsider.length - remainingSlots > 1 ? "s were" : " was"} ignored.`
        );
      }

      // Start processing first image
      if (filesToProcess.length > 0) {
        // Generate unique upload session ID for this batch of files
        // This prevents replacing images from previous upload sessions
        const newSessionId = `session-${Date.now()}-${Math.random()}`;
        setUploadSessionId(newSessionId);
        console.log(
          "[ImageProcessor] Starting new upload session:",
          newSessionId
        );

        // Store all files in queue for navigation
        setFileQueue(filesToProcess);
        setCurrentCropFile(filesToProcess[0]);
        setCurrentFileIndex(0);
        setCroppingIndex(processedImages.length);
        setSelectedFiles(filesToProcess.slice(1)); // Store remaining files for backward compatibility
        // Initialize watermark settings for first image (always use shop name)
        setWatermarkEnabled(false);
        setWatermarkText(shopName || ""); // Store shopName in state for consistency
        setWatermarkOpacity([20]);
        setWatermarkPosition("bottom-right");
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [
      processedImages.length,
      existingProcessedImages.length,
      maxImages,
      shopName,
    ]
  );

  // Apply watermark to image using canvas
  const applyWatermark = useCallback(
    async (imageFile: File): Promise<File> => {
      // Use shopName as watermark text (always use shop name, not watermarkText state)
      const textToUse = shopName || watermarkText;
      console.log("[WATERMARK] Applying watermark:", {
        watermarkEnabled,
        shopName,
        watermarkText,
        textToUse,
        watermarkOpacity: watermarkOpacity[0],
        watermarkPosition,
      });

      if (!watermarkEnabled) {
        console.log("[WATERMARK] Watermark disabled, skipping");
        return imageFile; // Return original if watermark disabled
      }

      if (!textToUse?.trim()) {
        console.warn("[WATERMARK] No text available, skipping watermark");
        return imageFile; // Return original if no text
      }

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new window.Image();
          img.onload = () => {
            // Defensive: avoid drawing broken images (e.g. large PNGs failing on Android)
            if (
              !img.complete ||
              img.naturalWidth === 0 ||
              img.naturalHeight === 0
            ) {
              reject(
                new Error(
                  "Image failed to load or is invalid (try a smaller image)"
                )
              );
              return;
            }

            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");

            if (!ctx) {
              reject(new Error("Failed to get canvas context"));
              return;
            }

            // Draw original image (wrap in try/catch for broken-image edge cases)
            try {
              ctx.drawImage(img, 0, 0);
            } catch (drawError) {
              reject(
                new Error(
                  `Image could not be drawn (file may be too large or unsupported): ${drawError instanceof Error ? drawError.message : String(drawError)}`
                )
              );
              return;
            }

            // Set watermark style - Jost bold font, white text at 10% opacity
            const fontSize = Math.max(img.width / 25, 20);
            ctx.font = `bold ${fontSize}px "Jost", sans-serif`;
            ctx.fillStyle = `rgba(255, 255, 255, 0.20)`; // White text at 20% opacity
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            // Calculate text dimensions
            const textMetrics = ctx.measureText(textToUse);
            const textWidth = textMetrics.width;
            const textHeight = fontSize;

            // Calculate spacing for repeating pattern
            // Use larger spacing to avoid overcrowding
            const spacing = Math.max(textWidth, textHeight) * 1.25;

            // Calculate the diagonal distance needed to cover the entire image
            const diagonal = Math.sqrt(
              img.width * img.width + img.height * img.height
            );

            // Rotate context 45 degrees (counter-clockwise)
            ctx.save();
            ctx.translate(img.width / 2, img.height / 2);
            ctx.rotate(-Math.PI / 4); // -45 degrees

            // Draw repeating watermark pattern across the entire image
            // Calculate how many repetitions we need in each direction
            const repetitionsX = Math.ceil(diagonal / spacing) + 2;
            const repetitionsY = Math.ceil(diagonal / spacing) + 2;

            // Start from center and work outward
            const startOffset = -(repetitionsX / 2) * spacing;

            for (let i = 0; i < repetitionsY; i++) {
              for (let j = 0; j < repetitionsX; j++) {
                const x = startOffset + j * spacing;
                const y = startOffset + i * spacing;
                ctx.fillText(textToUse, x, y);
              }
            }

            ctx.restore();

            // Convert canvas to blob, then to File
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("Failed to create watermark"));
                  return;
                }
                const watermarkedFile = new File([blob], imageFile.name, {
                  type: imageFile.type,
                  lastModified: Date.now(),
                });
                resolve(watermarkedFile);
              },
              imageFile.type,
              0.95 // Quality
            );
          };
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(imageFile);
      });
    },
    [
      watermarkEnabled,
      shopName,
      watermarkText,
      watermarkOpacity,
      watermarkPosition,
    ]
  );

  // Compress image
  const compressImage = useCallback(async (file: File): Promise<File> => {
    try {
      const options = {
        maxSizeMB: 1, // Max 1MB
        maxWidthOrHeight: 1920, // Max dimension
        useWebWorker: true,
        fileType: file.type,
      };

      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error("Compression error:", error);
      toast.error("Failed to compress image");
      logClientError({
        code: "IMAGE_PROCESSOR_COMPRESSION_FAILED",
        message:
          error instanceof Error ? error.message : "Failed to compress image",
        metadata: {
          component: "ImageProcessor",
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        },
      });
      return file; // Return original on error
    }
  }, []);

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

  // Save current image's crop state and watermark settings
  const saveCurrentImageState = useCallback(() => {
    if (currentFileIndex === null || currentFileIndex < 0) return;

    // Get coordinates if cropper is available
    let coordinates = null;
    if (cropperRef.current) {
      try {
        coordinates = cropperRef.current.getCoordinates();
        // Only save if we got valid coordinates
        if (!coordinates) {
          console.warn("No coordinates available to save");
          return;
        }
      } catch (error) {
        console.warn("Could not get coordinates:", error);
        return;
      }
    } else {
      console.warn("Cropper ref not available");
      return;
    }

    const state: ImageCropState = {
      coordinates,
      watermarkEnabled,
      watermarkText: shopName || watermarkText, // Always use shopName
      watermarkOpacity,
      watermarkPosition,
    };

    setImageStates((prev) => {
      const newMap = new Map(prev);
      newMap.set(currentFileIndex, state);
      return newMap;
    });
  }, [
    currentFileIndex,
    watermarkEnabled,
    shopName,
    watermarkText,
    watermarkOpacity,
    watermarkPosition,
  ]);

  // Note: We don't auto-save on crop change to avoid conflicts with restoration
  // State is saved when navigating between images or when processing

  // Navigate to a specific image and restore its state
  const navigateToImage = useCallback(
    (index: number, skipSave = false) => {
      // Save current state before navigating away (unless we're told to skip)
      if (
        !skipSave &&
        currentFileIndex !== null &&
        currentFileIndex >= 0 &&
        currentFileIndex !== index
      ) {
        saveCurrentImageState();
      }

      // Update to new image
      setCurrentFileIndex(index);
      setCurrentCropFile(fileQueue[index]);

      // Restore saved state for this image
      const savedState = imageStates.get(index);
      if (savedState) {
        setWatermarkEnabled(savedState.watermarkEnabled);
        // Always use shopName for watermark text (it's read-only now)
        setWatermarkText(shopName || savedState.watermarkText);
        setWatermarkOpacity(savedState.watermarkOpacity);
        setWatermarkPosition(savedState.watermarkPosition);
      } else {
        // Initialize with defaults if no saved state
        setWatermarkEnabled(false);
        setWatermarkText(shopName || ""); // Always use shopName
        setWatermarkOpacity([50]);
        setWatermarkPosition("bottom-right");
      }
    },
    [fileQueue, imageStates, currentFileIndex, saveCurrentImageState, shopName]
  );

  // Restore crop coordinates when cropper is ready
  React.useEffect(() => {
    if (cropperRef.current && currentFileIndex !== null && currentCropFile) {
      const savedState = imageStates.get(currentFileIndex);
      if (savedState?.coordinates) {
        // Small delay to ensure cropper is fully initialized
        const timeoutId = setTimeout(() => {
          if (cropperRef.current) {
            try {
              cropperRef.current.setCoordinates(savedState.coordinates);
            } catch (error) {
              console.warn("Could not restore coordinates:", error);
            }
          }
        }, 150);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [currentFileIndex, currentCropFile, imageStates]);

  // Auto-save watermark changes
  React.useEffect(() => {
    if (currentFileIndex !== null && currentFileIndex >= 0) {
      saveCurrentImageState();
    }
  }, [
    watermarkEnabled,
    watermarkText,
    watermarkOpacity,
    watermarkPosition,
    currentFileIndex,
    saveCurrentImageState,
  ]);

  // Process current image: crop -> watermark -> compress
  const processCurrentImage = useCallback(async () => {
    if (!currentCropFile) return;

    try {
      // Step 0: Check if we've reached max images limit (safety check)
      const currentTotal =
        processedImages.length + existingProcessedImages.length;
      if (currentTotal >= maxImages) {
        toast.error(`Maximum ${maxImages} images reached`);
        setCurrentCropFile(null);
        setCroppingIndex(null);
        setFileQueue([]);
        setCurrentFileIndex(0);
        return;
      }

      // Step 0: Save current state before processing (captures final crop position)
      // Use a small delay to ensure cropper is ready
      await new Promise((resolve) => setTimeout(resolve, 50));
      saveCurrentImageState();

      // Step 1: Get cropped image
      let processedFile = await getCroppedImage();
      if (!processedFile) {
        toast.error("Failed to crop image");
        return;
      }

      // Step 2: Apply watermark if enabled
      processedFile = await applyWatermark(processedFile);

      // Step 3: Compress image
      processedFile = await compressImage(processedFile);

      // Step 4: Create preview
      const preview = URL.createObjectURL(processedFile);

      // Step 5: Add to processed images (or replace if already exists in SAME upload session)
      const newProcessedImage: ProcessedImage = {
        id: `processed-${Date.now()}-${Math.random()}`,
        file: processedFile,
        preview,
        originalName: currentCropFile.name,
        originalFileIndex: currentFileIndex, // Track which file in queue this came from
        // Store upload session ID to prevent replacing images from different sessions
        uploadSessionId: uploadSessionId || undefined,
      };

      setProcessedImages((prev) => {
        // CRITICAL: Always preserve existing images - never reset the array
        // This ensures previously processed images are never lost

        console.log(
          "[ImageProcessor] setProcessedImages CALLED in processCurrentImage:",
          {
            prevCount: prev.length,
            prevIds: prev.map((img) => img.id),
            newImageId: newProcessedImage.id,
            newImageName: newProcessedImage.originalName,
            currentFileIndex,
            uploadSessionId,
            existingProcessedImagesCount: existingProcessedImages.length,
          }
        );

        // Only replace if we have a processed image from the SAME file in the SAME upload session
        // This prevents replacing images from previous upload sessions
        // CRITICAL: Never replace existing images (those with "existing-" prefix)
        const existingIndex = prev.findIndex((img) => {
          // Never match existing images (already uploaded images)
          if (img.id.startsWith("existing-")) {
            return false;
          }
          // Only replace if same file index AND same upload session
          return (
            img.originalFileIndex === currentFileIndex &&
            img.uploadSessionId === uploadSessionId &&
            uploadSessionId !== null
          ); // Only replace if we're in the same session
        });

        if (existingIndex >= 0) {
          // Replace the existing processed image (same file, same session, reprocessed)
          console.log(
            "[ImageProcessor] Replacing existing image at index:",
            existingIndex,
            "(same session)"
          );
          const updated = [...prev];
          // Clean up the old preview URL to prevent memory leaks
          URL.revokeObjectURL(updated[existingIndex].preview);
          updated[existingIndex] = newProcessedImage;
          console.log("[ImageProcessor] After replacement:", {
            count: updated.length,
            ids: updated.map((img) => img.id),
          });
          return updated;
        } else {
          // Safety check: Don't add if we've reached max images
          const newTotal = prev.length + existingProcessedImages.length + 1;
          if (newTotal > maxImages) {
            console.log("[ImageProcessor] Max images reached, not adding");
            toast.error(`Maximum ${maxImages} images reached`);
            URL.revokeObjectURL(preview); // Clean up the preview URL
            return prev; // Return existing state unchanged
          }
          // IMPORTANT: Add new processed image to existing ones (don't replace)
          // This ensures previously processed images are preserved
          // Always create a new array to trigger React update
          const newState = [...prev, newProcessedImage];
          // Update ref immediately to track current state
          processedImagesRef.current = newState;
          console.log("[ImageProcessor] ADDING NEW IMAGE:", {
            prevCount: prev.length,
            newCount: newState.length,
            prevIds: prev.map((img) => img.id),
            newId: newProcessedImage.id,
            allNewIds: newState.map((img) => img.id),
            stack: new Error().stack?.split("\n").slice(1, 4).join("\n"),
          });
          return newState;
        }
      });

      // Step 6: Move to next file in queue if available
      if (currentFileIndex < fileQueue.length - 1) {
        // State already saved at the start of this function
        const nextIndex = currentFileIndex + 1;
        navigateToImage(nextIndex);
        setCroppingIndex((prev) => (prev !== null ? prev + 1 : 0));
        // Update selectedFiles for backward compatibility
        setSelectedFiles((prev) => prev.slice(1));
      } else {
        // Done processing all images
        setCurrentCropFile(null);
        setCroppingIndex(null);
        setFileQueue([]);
        setCurrentFileIndex(0);
        setUploadSessionId(null); // Clear session ID
        setImageStates(new Map()); // Clear saved states
        toast.success("All images processed successfully");
      }
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to process image");
      logClientError({
        code: "IMAGE_PROCESSOR_PROCESSING_FAILED",
        message:
          error instanceof Error ? error.message : "Failed to process image",
        metadata: {
          component: "ImageProcessor",
          fileName: currentCropFile?.name,
          fileSize: currentCropFile?.size,
          fileType: currentCropFile?.type,
          currentFileIndex,
          totalFiles: fileQueue.length,
        },
      });
    }
  }, [
    currentCropFile,
    currentFileIndex,
    fileQueue,
    getCroppedImage,
    applyWatermark,
    compressImage,
    saveCurrentImageState,
    navigateToImage,
    processedImages.length,
    existingProcessedImages.length,
    maxImages,
    uploadSessionId, // Added missing dependency
  ]);

  // Remove processed image (works for both new and existing images)
  const removeImage = useCallback((id: string) => {
    console.log("[ImageProcessor] removeImage CALLED:", {
      idToRemove: id,
      currentCount: processedImagesRef.current.length,
      currentIds: processedImagesRef.current.map((img) => img.id),
      isExisting: id.startsWith("existing-"),
    });

    // Check if this is an existing image (already uploaded)
    if (id.startsWith("existing-")) {
      // Find the image in allImages to get its URL
      const allImagesCurrent = [...existingProcessedImages, ...processedImagesRef.current];
      const imageToRemove = allImagesCurrent.find((img) => img.id === id);
      
      if (imageToRemove && imageToRemove.preview) {
        // Track this URL for deletion from Uploadthing
        const urlToRemove = imageToRemove.preview;
        
        // Update removed images state
        setRemovedExistingImages((prev) => {
          // Only add if not already in the list
          if (!prev.includes(urlToRemove)) {
            const updated = [...prev, urlToRemove];
            console.log("[ImageProcessor] Tracking removed existing image:", {
              url: urlToRemove,
              allRemoved: updated,
            });
            // Notify parent about removed existing images
            if (onExistingImagesRemoved) {
              onExistingImagesRemoved(updated);
            }
            return updated;
          }
          return prev;
        });

        // Immediately update parent with filtered images (excluding the removed one)
        // Compute filtered existing images with the new removed list
        const newRemovedList = removedExistingImages.includes(urlToRemove)
          ? removedExistingImages
          : [...removedExistingImages, urlToRemove];
        const filteredExistingImages = existingImages
          .filter((url) => !newRemovedList.includes(url))
          .map((url, index) => ({
            id: `existing-${index}-${url}`,
            file: new File([], `existing-${index}.jpg`),
            preview: url,
            originalName: `existing-image-${index + 1}`,
          }));
        const updatedAllImages = [...filteredExistingImages, ...processedImagesRef.current];
        onImagesProcessedRef.current(updatedAllImages);
      }
    } else {
      // This is a new processed image - remove from processedImages
      setProcessedImages((prev) => {
        const image = prev.find((img) => img.id === id);
        if (image && image.preview.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(image.preview); // Clean up object URL
          } catch (e) {
            // Ignore errors if URL was already revoked
          }
        }
        const filtered = prev.filter((img) => img.id !== id);
        console.log("[ImageProcessor] After removal:", {
          prevCount: prev.length,
          newCount: filtered.length,
          removedId: id,
          remainingIds: filtered.map((img) => img.id),
        });
        // Notify parent about the change
        const updatedAllImages = [...existingProcessedImages, ...filtered];
        onImagesProcessedRef.current(updatedAllImages);
        return filtered;
      });
    }
  }, [existingImages, existingProcessedImages, removedExistingImages, onExistingImagesRemoved]);

  // Store callback in ref to avoid dependency issues
  const onImagesProcessedRef = React.useRef(onImagesProcessed);

  // Update ref when callback changes
  React.useEffect(() => {
    onImagesProcessedRef.current = onImagesProcessed;
  }, [onImagesProcessed]);

  // Update processed images callback whenever processedImages changes
  // Use ref to track previous value and avoid infinite loops
  const prevProcessedImagesRef = React.useRef<string>("");

  // Create stable allImages array
  const allImages = React.useMemo(() => {
    return [...existingProcessedImages, ...processedImages];
  }, [existingProcessedImages, processedImages]);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Handle drag start
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // Handle drop to reorder images
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    // Reorder images
    const reorderedImages = [...allImages];
    const [draggedImage] = reorderedImages.splice(draggedIndex, 1);
    reorderedImages.splice(dropIndex, 0, draggedImage);

    // Separate back into existing and processed images while preserving order
    const newExistingImages: ProcessedImage[] = [];
    const newProcessedImages: ProcessedImage[] = [];

    reorderedImages.forEach((img) => {
      if (img.id.startsWith("existing-")) {
        newExistingImages.push(img);
      } else {
        newProcessedImages.push(img);
      }
    });

    // Update processed images directly
    setProcessedImages(newProcessedImages);

    // Notify parent with the new order (this will update existing images in parent)
    // The parent will handle updating the existing images array
    onImagesProcessedRef.current(reorderedImages);

    setDraggedIndex(null);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Notify parent when images actually change (not on every render)
  React.useEffect(() => {
    // Create a stable key to compare
    const currentKey = JSON.stringify({
      processed: processedImages.map((img) => img.id),
      existing: existingProcessedImages.map((img) => img.id),
    });

    const prevKey = prevProcessedImagesRef.current;

    // Only call onImagesProcessed if something actually changed
    if (currentKey !== prevKey) {
      console.log("[ImageProcessor] NOTIFYING PARENT (onImagesProcessed):", {
        prevKey,
        currentKey,
        processedCount: processedImages.length,
        processedIds: processedImages.map((img) => img.id),
        existingCount: existingProcessedImages.length,
        existingIds: existingProcessedImages.map((img) => img.id),
        allImagesCount: allImages.length,
        allImagesIds: allImages.map((img) => img.id),
      });
      prevProcessedImagesRef.current = currentKey;
      // Use ref to call callback to avoid dependency issues
      onImagesProcessedRef.current(allImages);
    } else {
      console.log("[ImageProcessor] No change detected, not notifying parent");
    }
  }, [processedImages, existingProcessedImages, allImages]);

  return (
    <div className="flex flex-col gap-y-4">
      <Label>Product Photos</Label>

      {/* All Images Preview with Drag and Drop */}
      {allImages.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Product Photos (drag to reorder - first image will be the main
            photo):
          </p>
          <div className="flex flex-wrap gap-2">
            {allImages.map((img, index) => {
              const isExisting = img.id.startsWith("existing-");
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;

              return (
                <div
                  key={img.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`relative w-24 h-24 group cursor-move ${
                    isDragging ? "opacity-50" : ""
                  } ${
                    isDragOver ? "ring-2 ring-purple-500 ring-offset-2" : ""
                  } transition-all`}
                >
                  <Image
                    fill
                    src={img.preview}
                    alt={img.originalName}
                    className="object-cover rounded"
                    sizes="96px"
                  />
                  {/* Drag handle indicator */}
                  <div className="absolute top-1 left-1 bg-black/50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-3 h-3" />
                  </div>
                  {/* Image number indicator */}
                  <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                    {index + 1}
                  </div>
                  {/* Remove button - now works for both existing and new images */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => removeImage(img.id)}
                    className="absolute top-0 right-0 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  {/* Status badge for existing images */}
                  {isExisting && (
                    <div className="absolute top-1 left-1 bg-purple-500 text-white text-xs px-1 rounded">
                      Saved
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* File Input */}
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={allImages.length >= maxImages}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          {allImages.length >= maxImages
            ? `Maximum ${maxImages} images reached`
            : `Select Images (${allImages.length}/${maxImages})`}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Cropping Dialog */}
      <Dialog
        open={croppingIndex !== null}
        onOpenChange={(open) => {
          if (!open) {
            // Cancel cropping - close dialog and reset
            setCurrentCropFile(null);
            setCroppingIndex(null);
            setFileQueue([]);
            setCurrentFileIndex(0);
            setSelectedFiles([]);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-full overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>
              Image {currentFileIndex + 1} of {fileQueue.length}
            </DialogTitle>
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
                  key={`cropper-${currentFileIndex}-${currentCropFile.name}`}
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
                    aspectRatio: 1, // Square crop (you can make this configurable)
                  }}
                  imageRestriction={ImageRestriction.stencil}
                />
              </div>

              {/* Watermark Settings */}
              <div className="border-t pt-4 space-y-4 w-full max-w-full">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="watermark-enabled"
                    checked={watermarkEnabled}
                    onCheckedChange={(checked) =>
                      setWatermarkEnabled(checked as boolean)
                    }
                  />
                  <Label htmlFor="watermark-enabled">Apply Watermark</Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  if (currentFileIndex > 0) {
                    navigateToImage(currentFileIndex - 1);
                  }
                }}
                disabled={currentFileIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  if (currentFileIndex < fileQueue.length - 1) {
                    navigateToImage(currentFileIndex + 1);
                  }
                }}
                disabled={currentFileIndex === fileQueue.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={processCurrentImage}>
                {currentFileIndex === fileQueue.length - 1
                  ? "Process & Finish"
                  : "Process & Next"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

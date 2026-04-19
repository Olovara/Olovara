"use client";

import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { compressImageForUpload } from "@/lib/images/compress-client-image";

// Create uploader instance
const { uploadFiles } = genUploader<OurFileRouter>();

/**
 * Upload processed images to UploadThing using client SDK
 * Returns uploaded URLs + any skipped files (so the UI can warn sellers).
 *
 * Why this exists:
 * - Sellers were reporting "I uploaded 10 photos, later only 2 show".
 * - One major cause is oversized/invalid images being skipped without user feedback.
 * - Another cause is server-side cleanup deleting "temporary uploads" that never got finalized.
 *
 * This function handles the *client* side: validate, upload what we can, and report what was skipped.
 *
 * IMPORTANT:
 * - We do NOT throw for partially-skipped files (validation/upload response issues),
 *   because callers may still want to proceed with the successfully uploaded images.
 * - We DO throw if nothing can be uploaded or nothing was uploaded successfully.
 */
export type UploadProcessedFileSkip = {
  fileName: string;
  size: number;
  type: string;
  reason: string;
};

export type UploadProcessedFileSuccess = {
  fileName: string;
  url: string;
};

export type UploadProcessedImagesResult = {
  uploaded: UploadProcessedFileSuccess[];
  skipped: UploadProcessedFileSkip[];
};

export async function uploadProcessedImages(
  files: File[]
): Promise<UploadProcessedImagesResult> {
  // Validate input
  if (!files || !Array.isArray(files) || files.length === 0) {
    console.error("[UPLOAD IMAGES ERROR] Invalid files array:", {
      files,
      isArray: Array.isArray(files),
      length: files?.length,
      timestamp: new Date().toISOString(),
    });
    throw new Error("No files provided for upload");
  }

  // Validate each file before upload
  const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB
  const validFiles: File[] = [];
  const invalidFiles: Array<{ file: File; reason: string }> = [];

  for (const file of files) {
    if (!file || !(file instanceof File)) {
      invalidFiles.push({ file: file as any, reason: "Not a valid File object" });
      continue;
    }

    if (file.size === 0) {
      invalidFiles.push({ file, reason: "File is empty (0 bytes)" });
      continue;
    }

    if (file.size > MAX_FILE_SIZE) {
      invalidFiles.push({
        file,
        reason: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum (16MB)`,
      });
      continue;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      invalidFiles.push({ file, reason: `Invalid file type: ${file.type}` });
      continue;
    }

    validFiles.push(file);
  }

  // Convert invalid files into "skipped" entries for the caller UI.
  const skipped: UploadProcessedFileSkip[] = invalidFiles.map(({ file, reason }) => ({
    fileName: file?.name || "unknown",
    size: typeof file?.size === "number" ? file.size : 0,
    type: file?.type || "unknown",
    reason,
  }));

  // If no valid files, throw error
  if (validFiles.length === 0) {
    const errorMessage =
      invalidFiles.length === 1
        ? `Invalid file: ${invalidFiles[0].reason}`
        : `All ${invalidFiles.length} files are invalid. Reasons: ${invalidFiles.map((f) => f.reason).join(", ")}`;
    throw new Error(errorMessage);
  }

  // If some files are invalid, log (and allow caller to show a toast).
  if (skipped.length > 0) {
    console.warn("[UPLOAD IMAGES WARNING] Some files were skipped before upload:", {
      skipped,
      validFilesCount: validFiles.length,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const filesToSend = await Promise.all(
      validFiles.map((f) => compressImageForUpload(f))
    );

    console.log("[UPLOAD IMAGES] Starting upload:", {
      totalFiles: files.length,
      validFiles: validFiles.length,
      skippedFiles: skipped.length,
      fileNames: filesToSend.map((f) => f.name),
      fileSizes: filesToSend.map((f) => `${(f.size / 1024).toFixed(2)}KB`),
      timestamp: new Date().toISOString(),
    });

    // Upload files using UploadThing client SDK (already WebP-compressed client-side)
    const response = await uploadFiles("imageUploader", {
      files: filesToSend,
      onUploadProgress: (progress) => {
        console.log(`[UPLOAD IMAGES] Upload progress: ${progress}%`);
      },
    });

    // Validate response
    if (!response || !Array.isArray(response)) {
      console.error("[UPLOAD IMAGES ERROR] Invalid response from uploadFiles:", {
        response,
        responseType: typeof response,
        timestamp: new Date().toISOString(),
      });
      throw new Error("Invalid response from upload service");
    }

    // Extract URLs from response and validate them
    const uploaded: UploadProcessedFileSuccess[] = [];
    const failedUploads: Array<{ file: File; reason: string }> = [];

    for (let i = 0; i < response.length; i++) {
      const fileResponse = response[i];
      const file = filesToSend[i];

      if (!fileResponse) {
        failedUploads.push({ file, reason: "No response from upload service" });
        continue;
      }

      const url = fileResponse.url || fileResponse.ufsUrl;

      if (!url || typeof url !== "string") {
        failedUploads.push({
          file,
          reason: `Invalid URL in response: ${JSON.stringify(fileResponse)}`,
        });
        continue;
      }

      // Validate URL format
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        failedUploads.push({ file, reason: `Invalid URL format: ${url}` });
        continue;
      }

      uploaded.push({
        fileName: file?.name || "unknown",
        url,
      });
    }

    // Log failed uploads
    if (failedUploads.length > 0) {
      console.error("[UPLOAD IMAGES ERROR] Some uploads failed:", {
        failedUploads: failedUploads.map(({ file, reason }) => ({
          name: file.name,
          size: file.size,
          reason,
        })),
        successfulUploads: uploaded.length,
        totalFiles: validFiles.length,
        timestamp: new Date().toISOString(),
      });
    }

    // If all uploads failed, throw error
    if (uploaded.length === 0) {
      const errorMessage =
        failedUploads.length === 1
          ? `Upload failed: ${failedUploads[0].reason}`
          : `All ${failedUploads.length} uploads failed. Reasons: ${failedUploads.map((f) => f.reason).join(", ")}`;
      throw new Error(errorMessage);
    }

    // If some uploads failed, report them as "skipped" so caller can warn the user.
    if (failedUploads.length > 0) {
      const uploadSkips: UploadProcessedFileSkip[] = failedUploads.map(({ file, reason }) => ({
        fileName: file?.name || "unknown",
        size: typeof file?.size === "number" ? file.size : 0,
        type: file?.type || "unknown",
        reason,
      }));

      skipped.push(...uploadSkips);

      console.warn("[UPLOAD IMAGES WARNING] Some files failed during upload:", {
        failedCount: uploadSkips.length,
        uploadedCount: uploaded.length,
        timestamp: new Date().toISOString(),
      });
    }

    console.log("[UPLOAD IMAGES] Upload successful:", {
      uploadedCount: uploaded.length,
      urls: uploaded.map((u) => u.url.substring(0, 50) + "..."), // Log partial URLs for privacy
      timestamp: new Date().toISOString(),
    });

    return { uploaded, skipped };
  } catch (error) {
    // Enhanced error logging
    console.error("[UPLOAD IMAGES ERROR] Upload failed:", {
      error: error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error,
      filesCount: validFiles.length,
      fileNames: validFiles.map((f) => f.name),
      fileSizes: validFiles.map((f) => `${(f.size / 1024).toFixed(2)}KB`),
      timestamp: new Date().toISOString(),
    });

    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Image upload failed: ${error.message}`);
    }
    throw new Error("Failed to upload images: Unknown error occurred");
  }
}

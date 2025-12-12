import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

// Create uploader instance
const { uploadFiles } = genUploader<OurFileRouter>();

/**
 * Upload processed images to UploadThing using client SDK
 * Returns array of uploaded file URLs
 * @throws Error with detailed information if upload fails
 */
export async function uploadProcessedImages(files: File[]): Promise<string[]> {
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
  const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
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
        reason: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum (4MB)`,
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

  // Log invalid files
  if (invalidFiles.length > 0) {
    console.error("[UPLOAD IMAGES ERROR] Invalid files detected:", {
      invalidFiles: invalidFiles.map(({ file, reason }) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        reason,
      })),
      validFilesCount: validFiles.length,
      timestamp: new Date().toISOString(),
    });
  }

  // If no valid files, throw error
  if (validFiles.length === 0) {
    const errorMessage =
      invalidFiles.length === 1
        ? `Invalid file: ${invalidFiles[0].reason}`
        : `All ${invalidFiles.length} files are invalid. Reasons: ${invalidFiles.map((f) => f.reason).join(", ")}`;
    throw new Error(errorMessage);
  }

  // If some files are invalid, log warning but continue with valid ones
  if (invalidFiles.length > 0) {
    console.warn(
      `[UPLOAD IMAGES WARNING] ${invalidFiles.length} file(s) skipped, uploading ${validFiles.length} valid file(s)`
    );
  }

  try {
    console.log("[UPLOAD IMAGES] Starting upload:", {
      totalFiles: files.length,
      validFiles: validFiles.length,
      invalidFiles: invalidFiles.length,
      fileNames: validFiles.map((f) => f.name),
      fileSizes: validFiles.map((f) => `${(f.size / 1024).toFixed(2)}KB`),
      timestamp: new Date().toISOString(),
    });

    // Upload files using UploadThing client SDK
    const response = await uploadFiles("imageUploader", {
      files: validFiles,
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
    const urls: string[] = [];
    const failedUploads: Array<{ file: File; reason: string }> = [];

    for (let i = 0; i < response.length; i++) {
      const fileResponse = response[i];
      const file = validFiles[i];

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

      urls.push(url);
    }

    // Log failed uploads
    if (failedUploads.length > 0) {
      console.error("[UPLOAD IMAGES ERROR] Some uploads failed:", {
        failedUploads: failedUploads.map(({ file, reason }) => ({
          name: file.name,
          size: file.size,
          reason,
        })),
        successfulUploads: urls.length,
        totalFiles: validFiles.length,
        timestamp: new Date().toISOString(),
      });
    }

    // If all uploads failed, throw error
    if (urls.length === 0) {
      const errorMessage =
        failedUploads.length === 1
          ? `Upload failed: ${failedUploads[0].reason}`
          : `All ${failedUploads.length} uploads failed. Reasons: ${failedUploads.map((f) => f.reason).join(", ")}`;
      throw new Error(errorMessage);
    }

    // If some uploads failed, log warning but return successful URLs
    if (failedUploads.length > 0) {
      console.warn(
        `[UPLOAD IMAGES WARNING] ${failedUploads.length} upload(s) failed, ${urls.length} succeeded`
      );
      // Still throw error to let caller know some failed
      throw new Error(
        `${failedUploads.length} of ${validFiles.length} image(s) failed to upload. ${urls.length} image(s) uploaded successfully.`
      );
    }

    console.log("[UPLOAD IMAGES] Upload successful:", {
      uploadedCount: urls.length,
      urls: urls.map((url) => url.substring(0, 50) + "..."), // Log partial URLs for privacy
      timestamp: new Date().toISOString(),
    });

    return urls;
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

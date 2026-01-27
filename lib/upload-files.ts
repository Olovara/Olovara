import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

// Create uploader instance
const { uploadFiles } = genUploader<OurFileRouter>();

/**
 * Upload processed files to UploadThing using client SDK
 * Returns uploaded URLs + any skipped files (so the UI can warn sellers).
 *
 * IMPORTANT:
 * - This is for digital product files (currently PDFs).
 * - We validate locally to avoid silent failures.
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

export type UploadProcessedFilesResult = {
  uploaded: UploadProcessedFileSuccess[];
  skipped: UploadProcessedFileSkip[];
};

export async function uploadProcessedFiles(
  files: File[]
): Promise<UploadProcessedFilesResult> {
  try {
    // Basic input validation (avoid confusing SDK errors)
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new Error("No files provided for upload");
    }

    // Product files are currently PDFs only (matches UploadThing router).
    // Keep this in sync with `app/api/uploadthing/core.ts`.
    const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB

    const validFiles: File[] = [];
    const skipped: UploadProcessedFileSkip[] = [];

    for (const file of files) {
      if (!file || !(file instanceof File)) {
        skipped.push({
          fileName: (file as any)?.name || "unknown",
          size: typeof (file as any)?.size === "number" ? (file as any).size : 0,
          type: (file as any)?.type || "unknown",
          reason: "Not a valid File object",
        });
        continue;
      }

      if (file.size === 0) {
        skipped.push({
          fileName: file.name,
          size: file.size,
          type: file.type || "unknown",
          reason: "File is empty (0 bytes)",
        });
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        skipped.push({
          fileName: file.name,
          size: file.size,
          type: file.type || "unknown",
          reason: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum (16MB)`,
        });
        continue;
      }

      // Only allow PDFs for now (matches the UploadThing route)
      if (file.type !== "application/pdf") {
        skipped.push({
          fileName: file.name,
          size: file.size,
          type: file.type || "unknown",
          reason: `Invalid file type: ${file.type || "unknown"} (PDF required)`,
        });
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      const reason =
        skipped.length === 1
          ? skipped[0].reason
          : `All ${skipped.length} file(s) are invalid: ${skipped.map((s) => s.reason).join(", ")}`;
      throw new Error(reason);
    }

    // Upload files using UploadThing client SDK
    const response = await uploadFiles("productFileUpload", {
      files: validFiles,
      onUploadProgress: (progress) => {
        console.log(`Upload progress: ${progress}%`);
      },
    });

    // Extract URLs from response
    const uploaded: UploadProcessedFileSuccess[] = [];
    const failed: UploadProcessedFileSkip[] = [];

    for (let i = 0; i < response.length; i++) {
      const fileResponse = response[i];
      const file = validFiles[i];
      const url = fileResponse?.url || fileResponse?.ufsUrl;

      if (!url || typeof url !== "string") {
        failed.push({
          fileName: file?.name || "unknown",
          size: typeof file?.size === "number" ? file.size : 0,
          type: file?.type || "unknown",
          reason: `Invalid upload response: ${JSON.stringify(fileResponse)}`,
        });
        continue;
      }

      uploaded.push({
        fileName: file?.name || "unknown",
        url,
      });
    }

    if (failed.length > 0) {
      skipped.push(...failed);
      console.warn("[UPLOAD FILES WARNING] Some files failed during upload:", {
        failed,
      });
    }

    if (uploaded.length === 0) {
      throw new Error("Upload failed: no valid URL returned");
    }

    return { uploaded, skipped };
  } catch (error) {
    console.error("Error uploading files:", error);

    // Preserve the real underlying message for diagnostics + user-facing toast.
    if (error instanceof Error) {
      throw new Error(`Failed to upload files: ${error.message}`);
    }
    throw new Error("Failed to upload files: Unknown error");
  }
}

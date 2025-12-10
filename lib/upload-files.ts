import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

// Create uploader instance
const { uploadFiles } = genUploader<OurFileRouter>();

/**
 * Upload processed files to UploadThing using client SDK
 * Returns array of uploaded file URLs
 */
export async function uploadProcessedFiles(files: File[]): Promise<string[]> {
  try {
    // Upload files using UploadThing client SDK
    const response = await uploadFiles("productFileUpload", {
      files: files,
      onUploadProgress: (progress) => {
        console.log(`Upload progress: ${progress}%`);
      },
    });

    // Extract URLs from response
    const urls = response.map((file) => file.url || file.ufsUrl);
    return urls;
  } catch (error) {
    console.error("Error uploading files:", error);
    throw new Error("Failed to upload files");
  }
}

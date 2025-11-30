import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

// Create uploader instance
const { uploadFiles } = genUploader<OurFileRouter>();

/**
 * Upload processed images to UploadThing using client SDK
 * Returns array of uploaded file URLs
 */
export async function uploadProcessedImages(files: File[]): Promise<string[]> {
  try {
    // Upload files using UploadThing client SDK
    const response = await uploadFiles("imageUploader", {
      files: files,
      onUploadProgress: (progress) => {
        console.log(`Upload progress: ${progress}%`);
      },
    });

    // Extract URLs from response
    const urls = response.map((file) => file.url || file.ufsUrl);
    return urls;
  } catch (error) {
    console.error("Error uploading images:", error);
    throw new Error("Failed to upload images");
  }
}

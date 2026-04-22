"use client";

import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { compressImageForUpload } from "@/lib/images/compress-client-image";

const { uploadFiles } = genUploader<OurFileRouter>();

/**
 * Upload reference images for a custom order using UploadThing.
 * By default runs `compressImageForUpload` first (same as product photos). Pass
 * `alreadyCompressed: true` when files were already compressed for thumbnails (submit path).
 */
export async function uploadCustomOrderReferenceImages(
  files: File[],
  options?: { alreadyCompressed?: boolean },
): Promise<{ urls: string[] }> {
  if (!files.length) {
    return { urls: [] };
  }

  const filesToSend = options?.alreadyCompressed
    ? files
    : await Promise.all(files.map((f) => compressImageForUpload(f)));

  const response = await uploadFiles("customOrderReferenceImages", {
    files: filesToSend,
  });

  if (!response || !Array.isArray(response)) {
    throw new Error("Invalid response from upload service");
  }

  const urls: string[] = [];
  for (const fileResponse of response) {
    const url = fileResponse?.url ?? fileResponse?.ufsUrl;
    if (url && typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"))) {
      urls.push(url);
    }
  }

  if (urls.length === 0) {
    throw new Error("Upload did not return valid image URLs");
  }

  return { urls };
}

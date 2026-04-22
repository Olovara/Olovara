"use client";

import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { compressImageForUpload } from "@/lib/images/compress-client-image";
import { CUSTOM_ORDER_MAX_PROGRESS_IMAGES } from "@/lib/custom-order-progress-config";

const { uploadFiles } = genUploader<OurFileRouter>();

/** Upload up to `CUSTOM_ORDER_MAX_PROGRESS_IMAGES` images for a seller progress post. */
export async function uploadCustomOrderProgressImages(
  files: File[],
): Promise<{ urls: string[] }> {
  if (!files.length) {
    return { urls: [] };
  }
  if (files.length > CUSTOM_ORDER_MAX_PROGRESS_IMAGES) {
    throw new Error(`At most ${CUSTOM_ORDER_MAX_PROGRESS_IMAGES} images`);
  }
  const filesToSend = await Promise.all(
    files.map((f) => compressImageForUpload(f)),
  );
  const response = await uploadFiles("customOrderProgressImages", {
    files: filesToSend,
  });
  if (!response || !Array.isArray(response)) {
    throw new Error("Invalid response from upload service");
  }
  const urls: string[] = [];
  for (const fileResponse of response) {
    const url = fileResponse?.url ?? fileResponse?.ufsUrl;
    if (
      url &&
      typeof url === "string" &&
      (url.startsWith("http://") || url.startsWith("https://"))
    ) {
      urls.push(url);
    }
  }
  if (urls.length === 0) {
    throw new Error("Upload did not return valid image URLs");
  }
  return { urls };
}

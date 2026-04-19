"use client";

import imageCompression from "browser-image-compression";

/** Skip re-encoding: vectors, or animated GIF (WebP would drop frames). */
const SKIP_TYPES = new Set(["image/svg+xml", "image/gif"]);

/**
 * Resize and encode to WebP before upload (browser-image-compression).
 * Falls back to the original file if compression fails so uploads still work.
 */
export async function compressImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || SKIP_TYPES.has(file.type)) {
    return file;
  }

  const base = file.name.replace(/\.[^/.]+$/, "") || "image";

  try {
    // Product photos: prioritize clarity. Higher maxSizeMB + maxWidthOrHeight preserves detail;
    // initialQuality nudges WebP toward sharper output (files grow accordingly).
    const compressed = await imageCompression(file, {
      maxSizeMB: 5,
      maxWidthOrHeight: 3000,
      useWebWorker: true,
      fileType: "image/webp",
      initialQuality: 0.93,
    });

    const name =
      compressed instanceof File &&
      compressed.name.toLowerCase().endsWith(".webp")
        ? compressed.name
        : `${base}.webp`;

    if (compressed instanceof File) {
      return new File([compressed], name, {
        type: "image/webp",
        lastModified: Date.now(),
      });
    }

    return new File([compressed], name, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch (e) {
    console.warn("[compressImageForUpload] Falling back to original:", e);
    return file;
  }
}

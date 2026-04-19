/**
 * UploadThing storage adapter
 * Implements the StorageAdapter interface for UploadThing
 */

import { UTApi } from "uploadthing/server";
import { processImageBufferToWebP } from "@/lib/images/process-image-server";
import type { StorageAdapter } from "./interface";

export class UploadThingAdapter implements StorageAdapter {
  private utapi: UTApi;

  constructor() {
    // Initialize UploadThing API client
    this.utapi = new UTApi();
  }

  /**
   * Upload a file from a URL
   * Fetches the file from the URL and uploads it to UploadThing
   */
  async uploadFromUrl(imageUrl: string): Promise<string> {
    try {
      // Fetch the image from the URL
      const response: Response = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Olovara-BulkImport/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
      }

      // Get the content type
      const contentType: string = response.headers.get("content-type") || "image/jpeg";
      
      // Validate it's an image
      if (!contentType.startsWith("image/")) {
        throw new Error(`Invalid content type: ${contentType}. Expected image/*`);
      }

      // Convert response to buffer, then normalize to WebP (same policy as browser uploads)
      const arrayBuffer: ArrayBuffer = await response.arrayBuffer();
      let buffer: Buffer = Buffer.from(arrayBuffer);
      try {
        buffer = await processImageBufferToWebP(buffer);
      } catch (e) {
        console.warn("[UPLOADTHING ADAPTER] WebP processing skipped, using original bytes:", e);
      }

      // Generate filename from URL or use timestamp
      const urlParts: string[] = imageUrl.split("/");
      const rawName: string =
        urlParts[urlParts.length - 1].split("?")[0] || `image-${Date.now()}`;
      const baseName = rawName.replace(/\.[^/.]+$/, "") || `image-${Date.now()}`;
      const webpFilename = `${baseName}.webp`;

      // Upload to UploadThing - convert Buffer to Uint8Array for File constructor
      const uint8Array = new Uint8Array(buffer);
      const file = new File([uint8Array], webpFilename, { type: "image/webp" });
      const uploadedFiles = await this.utapi.uploadFiles([file]);

      if (!uploadedFiles || uploadedFiles.length === 0) {
        throw new Error("UploadThing returned invalid response");
      }

      const firstResult = uploadedFiles[0];
      if (firstResult.error) {
        throw new Error(`UploadThing error: ${firstResult.error}`);
      }

      // Extract URL from the result - prefer ufsUrl (new API), fallback to url (deprecated)
      let uploadedUrl: string | undefined = firstResult.data?.ufsUrl || firstResult.data?.url;
      if (!uploadedUrl) {
        throw new Error("UploadThing response missing URL");
      }

      // Normalize UploadThing URLs to use utfs.io format for consistency
      // UTApi might return .ufs.sh subdomains, but we want to use utfs.io like the FileRouter
      // Convert .ufs.sh URLs to utfs.io format: https://x.ufs.sh/f/key -> https://utfs.io/f/key
      if (uploadedUrl.includes('.ufs.sh')) {
        console.log(`[UPLOADTHING ADAPTER] Detected .ufs.sh URL, normalizing: ${uploadedUrl}`);
        // Extract the file key from the .ufs.sh URL
        // URL format: https://xqhto0ljhm.ufs.sh/f/4bVmfkWCdmXO2CtwGxH6l8nbhzLqZeC2ipDakG974WIXo1JP
        const urlMatch = uploadedUrl.match(/https?:\/\/[^\/]+\/(?:f|file)\/([^\/\?]+)/);
        if (urlMatch && urlMatch[1]) {
          const fileKey = urlMatch[1];
          // Convert to utfs.io format for consistency with FileRouter uploads
          uploadedUrl = `https://utfs.io/f/${fileKey}`;
          console.log(`[UPLOADTHING ADAPTER] Normalized to: ${uploadedUrl}`);
        } else {
          console.warn(`[UPLOADTHING ADAPTER] Could not extract file key from URL: ${uploadedUrl}`);
        }
      }

      return uploadedUrl;
    } catch (error) {
      console.error("[UPLOADTHING ADAPTER] Error uploading from URL:", error);
      throw new Error(
        `Failed to upload image from URL: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Upload a file directly
   */
  async uploadFile(file: File | Buffer, filename?: string): Promise<string> {
    try {
      let fileToUpload: File;

      if (Buffer.isBuffer(file)) {
        let buf: Buffer = file;
        try {
          buf = await processImageBufferToWebP(buf);
        } catch (e) {
          console.warn("[UPLOADTHING ADAPTER] WebP processing skipped (buffer upload):", e);
        }
        const base = (filename || `file-${Date.now()}`).replace(/\.[^/.]+$/, "");
        const name = `${base}.webp`;
        const uint8Array = new Uint8Array(buf);
        fileToUpload = new File([uint8Array], name, { type: "image/webp" });
      } else {
        if (file.type.startsWith("image/") && file.type !== "image/svg+xml") {
          try {
            const ab = await file.arrayBuffer();
            const processed = await processImageBufferToWebP(Buffer.from(ab));
            const base = file.name.replace(/\.[^/.]+$/, "") || `file-${Date.now()}`;
            fileToUpload = new File([new Uint8Array(processed)], `${base}.webp`, {
              type: "image/webp",
            });
          } catch (e) {
            console.warn("[UPLOADTHING ADAPTER] WebP processing skipped (file upload):", e);
            fileToUpload = file;
          }
        } else {
          fileToUpload = file;
        }
      }

      const uploadedFiles = await this.utapi.uploadFiles([fileToUpload]);

      if (!uploadedFiles || uploadedFiles.length === 0) {
        throw new Error("UploadThing returned invalid response");
      }

      const firstResult = uploadedFiles[0];
      if (firstResult.error) {
        throw new Error(`UploadThing error: ${firstResult.error}`);
      }

      // Extract URL from the result - prefer ufsUrl (new API), fallback to url (deprecated)
      let uploadedUrl: string | undefined = firstResult.data?.ufsUrl || firstResult.data?.url;
      if (!uploadedUrl) {
        throw new Error("UploadThing response missing URL");
      }

      // Normalize UploadThing URLs to use utfs.io format for consistency
      // UTApi might return .ufs.sh subdomains, but we want to use utfs.io like the FileRouter
      // Convert .ufs.sh URLs to utfs.io format: https://x.ufs.sh/f/key -> https://utfs.io/f/key
      if (uploadedUrl.includes('.ufs.sh')) {
        // Extract the file key from the .ufs.sh URL
        // URL format: https://xqhto0ljhm.ufs.sh/f/4bVmfkWCdmXO2CtwGxH6l8nbhzLqZeC2ipDakG974WIXo1JP
        const urlMatch = uploadedUrl.match(/https?:\/\/[^\/]+\/(?:f|file)\/([^\/\?]+)/);
        if (urlMatch && urlMatch[1]) {
          const fileKey = urlMatch[1];
          // Convert to utfs.io format for consistency with FileRouter uploads
          uploadedUrl = `https://utfs.io/f/${fileKey}`;
          console.log(`[UPLOADTHING ADAPTER] Normalized URL from .ufs.sh to utfs.io: ${uploadedUrl}`);
        } else {
          console.warn(`[UPLOADTHING ADAPTER] Could not extract file key from URL: ${uploadedUrl}`);
        }
      }

      return uploadedUrl;
    } catch (error) {
      console.error("[UPLOADTHING ADAPTER] Error uploading file:", error);
      throw new Error(
        `Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Delete a file from UploadThing
   */
  async delete(url: string): Promise<void> {
    try {
      // Extract file key from UploadThing URL
      // UploadThing URLs format: https://utfs.io/f/{key}
      const urlParts = url.split("/");
      const fileKey = urlParts[urlParts.length - 1];

      if (!fileKey) {
        throw new Error("Invalid UploadThing URL format");
      }

      await this.utapi.deleteFiles(fileKey);
    } catch (error) {
      console.error("[UPLOADTHING ADAPTER] Error deleting file:", error);
      // Don't throw - deletion failures shouldn't break the import process
      // Just log the error
    }
  }
}


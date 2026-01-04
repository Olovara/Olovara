/**
 * Storage service factory
 * Returns the configured storage adapter
 * Currently uses UploadThing, but can be easily switched
 */

import { UploadThingAdapter } from "./uploadthing-adapter";
import type { StorageAdapter } from "./interface";

// Singleton instance
let storageInstance: StorageAdapter | null = null;

/**
 * Get the storage adapter instance
 * Uses singleton pattern to ensure one instance per process
 */
export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    // Currently using UploadThing, but can be switched to S3, Cloudinary, etc.
    storageInstance = new UploadThingAdapter();
  }
  return storageInstance;
}

/**
 * Reset storage instance (useful for testing)
 */
export function resetStorage(): void {
  storageInstance = null;
}


/**
 * Storage abstraction interface
 * Allows switching between different storage providers (UploadThing, S3, etc.)
 * without changing business logic
 */

export interface StorageAdapter {
  /**
   * Upload a file from a URL (fetch and upload)
   * @param url - The URL to fetch the file from
   * @returns The stored URL after upload
   */
  uploadFromUrl(url: string): Promise<string>;

  /**
   * Upload a file directly
   * @param file - The file to upload
   * @returns The stored URL after upload
   */
  uploadFile(file: File | Buffer, filename?: string): Promise<string>;

  /**
   * Delete a file from storage
   * @param url - The URL of the file to delete
   */
  delete(url: string): Promise<void>;
}


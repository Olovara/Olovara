import { auth } from "@/auth";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";
import { CUSTOM_ORDER_MAX_REFERENCE_IMAGES } from "@/lib/custom-order-reference-config";
import { CUSTOM_ORDER_MAX_PROGRESS_IMAGES } from "@/lib/custom-order-progress-config";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: "16MB", maxFileCount: 10 } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      const session = await auth();
      console.log(session); // Check if session is correctly fetched

      if (!session?.user?.id) throw new UploadThingError("Unauthorized");

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.ufsUrl);

      // Record the upload in the TemporaryUpload table
      try {
        await db.temporaryUpload.create({
          data: {
            fileKey: file.key,
            fileUrl: file.ufsUrl,
            userId: metadata.userId,
            // productId will be null until associated with a product
          },
        });
        console.log("Temporary upload recorded:", file.key);
      } catch (error) {
        console.error("Failed to record temporary upload:", error);

        // Log to error database
        logError({
          code: "IMAGE_UPLOAD_RECORD_FAILED",
          userId: metadata.userId,
          route: "/api/uploadthing",
          method: "POST",
          error,
          metadata: {
            fileKey: file.key,
            fileName: file.name,
            fileSize: file.size,
            uploadType: "imageUploader",
          },
        });

        throw new UploadThingError("Failed to record upload");
      }

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  // Single image uploader for profile images, banners, logos, etc.
  singleImageUploader: f({ image: { maxFileSize: "16MB", maxFileCount: 1 } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      const session = await auth();

      if (!session?.user?.id) throw new UploadThingError("Unauthorized");

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Single image upload complete for userId:", metadata.userId);
      console.log("file url", file.ufsUrl);

      // Record the upload in the TemporaryUpload table
      try {
        await db.temporaryUpload.create({
          data: {
            fileKey: file.key,
            fileUrl: file.ufsUrl,
            userId: metadata.userId,
            // productId will be null until associated with a product
          },
        });
        console.log("Temporary upload recorded:", file.key);
      } catch (error) {
        console.error("Failed to record temporary upload:", error);

        // Log to error database
        logError({
          code: "IMAGE_UPLOAD_RECORD_FAILED",
          userId: metadata.userId,
          route: "/api/uploadthing",
          method: "POST",
          error,
          metadata: {
            fileKey: file.key,
            fileName: file.name,
            fileSize: file.size,
            uploadType: "singleImageUploader",
          },
        });

        throw new UploadThingError("Failed to record upload");
      }

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  /** Buyer custom-order modal: optional inspiration / reference images (same max as `CUSTOM_ORDER_MAX_REFERENCE_IMAGES`). */
  customOrderReferenceImages: f({
    image: { maxFileSize: "16MB", maxFileCount: CUSTOM_ORDER_MAX_REFERENCE_IMAGES },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) throw new UploadThingError("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        await db.temporaryUpload.create({
          data: {
            fileKey: file.key,
            fileUrl: file.ufsUrl,
            userId: metadata.userId,
          },
        });
      } catch (error) {
        console.error("Failed to record custom order reference upload:", error);
        logError({
          code: "IMAGE_UPLOAD_RECORD_FAILED",
          userId: metadata.userId,
          route: "/api/uploadthing",
          method: "POST",
          error,
          metadata: {
            fileKey: file.key,
            fileName: file.name,
            fileSize: file.size,
            uploadType: "customOrderReferenceImages",
          },
        });
        throw new UploadThingError("Failed to record upload");
      }
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  /** Seller custom-order project thread: progress photos (max 3 per post). */
  customOrderProgressImages: f({
    image: { maxFileSize: "16MB", maxFileCount: CUSTOM_ORDER_MAX_PROGRESS_IMAGES },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) throw new UploadThingError("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        await db.temporaryUpload.create({
          data: {
            fileKey: file.key,
            fileUrl: file.ufsUrl,
            userId: metadata.userId,
          },
        });
      } catch (error) {
        console.error("Failed to record custom order progress upload:", error);
        logError({
          code: "IMAGE_UPLOAD_RECORD_FAILED",
          userId: metadata.userId,
          route: "/api/uploadthing",
          method: "POST",
          error,
          metadata: {
            fileKey: file.key,
            fileName: file.name,
            fileSize: file.size,
            uploadType: "customOrderProgressImages",
          },
        });
        throw new UploadThingError("Failed to record upload");
      }
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  // Digital product files (PDF). Explicit max size prevents "mystery" failures.
  productFileUpload: f({ "application/pdf": { maxFileSize: "16MB", maxFileCount: 1 } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      const session = await auth();

      if (!session?.user?.id) throw new UploadThingError("Unauthorized");

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.ufsUrl);

      // Record the upload in the TemporaryUpload table
      try {
        await db.temporaryUpload.create({
          data: {
            fileKey: file.key,
            fileUrl: file.ufsUrl,
            userId: metadata.userId,
            // productId will be null until associated with a product
          },
        });
        console.log("Temporary upload recorded:", file.key);
      } catch (error) {
        console.error("Failed to record temporary upload:", error);

        // Log to error database
        logError({
          code: "FILE_UPLOAD_RECORD_FAILED",
          userId: metadata.userId,
          route: "/api/uploadthing",
          method: "POST",
          error,
          metadata: {
            fileKey: file.key,
            fileName: file.name,
            fileSize: file.size,
            uploadType: "productFileUpload",
          },
        });

        throw new UploadThingError("Failed to record upload");
      }

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  dmcaDocumentUpload: f({
    "application/pdf": { maxFileSize: "16MB", maxFileCount: 1 },
    "application/msword": { maxFileSize: "16MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "16MB",
      maxFileCount: 1,
    },
    "image/jpeg": { maxFileSize: "16MB", maxFileCount: 1 },
    "image/png": { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      // For DMCA documents, we don't require authentication since it's a public form
      return { userId: "dmca-public" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("DMCA document upload complete");
      console.log("file url", file.ufsUrl);

      // Record the upload in the TemporaryUpload table
      try {
        await db.temporaryUpload.create({
          data: {
            fileKey: file.key,
            fileUrl: file.ufsUrl,
            userId: metadata.userId,
            // productId will be null until associated with a product
          },
        });
        console.log("DMCA document upload recorded:", file.key);
      } catch (error) {
        console.error("Failed to record DMCA document upload:", error);
        
        // Log to error database
        logError({
          code: "DMCA_UPLOAD_RECORD_FAILED",
          userId: metadata.userId,
          route: "/api/uploadthing",
          method: "POST",
          error,
          metadata: {
            fileKey: file.key,
            fileName: file.name,
            fileSize: file.size,
            uploadType: "dmcaDocumentUpload",
          },
        });
        
        throw new UploadThingError("Failed to record upload");
      }

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

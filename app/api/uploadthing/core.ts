import { auth } from "@/auth";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { db } from "@/lib/db";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 10 } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      const session = await auth();
      console.log(session); // Check if session is correctly fetched

      if (!session) throw new UploadThingError("Unauthorized");

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);

      // Record the upload in the TemporaryUpload table
      try {
        await db.temporaryUpload.create({
          data: {
            fileKey: file.key,
            fileUrl: file.url,
            userId: metadata.userId,
            // productId will be null until associated with a product
          },
        });
        console.log("Temporary upload recorded:", file.key);
      } catch (error) {
        console.error("Failed to record temporary upload:", error);
      }

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),

  productFileUpload: f({ "application/pdf": { maxFileCount: 1 } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      const session = await auth();

      if (!session) throw new UploadThingError("Unauthorized");

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);

      // Record the upload in the TemporaryUpload table
      try {
        await db.temporaryUpload.create({
          data: {
            fileKey: file.key,
            fileUrl: file.url,
            userId: metadata.userId,
            // productId will be null until associated with a product
          },
        });
        console.log("Temporary upload recorded:", file.key);
      } catch (error) {
        console.error("Failed to record temporary upload:", error);
      }

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
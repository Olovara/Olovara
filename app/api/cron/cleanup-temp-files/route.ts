import { UTApi } from "uploadthing/server";
import { db } from "@/lib/db";

const utapi = new UTApi();

export async function GET() {
  try {
    // Find temporary uploads older than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const tempUploads = await db.temporaryUpload.findMany({
      where: {
        createdAt: {
          lt: thirtyMinutesAgo
        },
        productId: null // Not associated with any product
      }
    });

    if (tempUploads.length > 0) {
      console.log(`Found ${tempUploads.length} temporary uploads to clean up`);
      
      await Promise.all(tempUploads.map(async (upload) => {
        try {
          await utapi.deleteFiles([upload.fileKey]);
          await db.temporaryUpload.delete({
            where: { id: upload.id }
          });
          console.log(`Cleaned up temporary upload: ${upload.fileKey}`);
        } catch (error) {
          console.error(`Failed to clean up ${upload.fileKey}:`, error);
        }
      }));
    }

    return new Response("Cleanup completed", { status: 200 });
  } catch (error) {
    console.error("Cleanup job error:", error);
    return new Response("Cleanup failed", { status: 500 });
  }
} 
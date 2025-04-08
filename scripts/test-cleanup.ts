const { UTApi } = require("uploadthing/server");
const { db } = require("@/lib/db"); // Assuming db is the PrismaClient instance

async function cleanupTempUploads() {
  try {
    // Calculate the time threshold (e.g., 30 minutes ago)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Find all temporary uploads older than the threshold
    const oldUploads = await db.temporaryUpload.findMany({ 
      where: {
        createdAt: { lt: thirtyMinutesAgo } // Filter by time
      }
    });

    // Filter in the script for records where productId is missing or null
    const tempUploadsToDelete = oldUploads.filter((upload: any) => !upload.productId);
    
    if (tempUploadsToDelete.length > 0) {
      console.log(`Found ${tempUploadsToDelete.length} temporary uploads older than 30 minutes to clean up`);
      const utapi = new UTApi();

      // Delete each identified temporary upload
      for (const upload of tempUploadsToDelete) { 
        try {
          // Delete from storage
          await utapi.deleteFiles(upload.fileKey);
          
          // Delete from database
          await db.temporaryUpload.delete({
            where: { id: upload.id } 
          });
          
          console.log(`Deleted temporary upload: ${upload.fileKey}`);
        } catch (error) {
          console.error(`Error deleting upload ${upload.fileKey}:`, error);
        }
      }
      console.log('Cleanup completed successfully');
    } else {
      console.log("No old temporary uploads found to clean up.");
    }

  } catch (error) {
    console.error('Error during cleanup process:', error);
  } finally {
    // Disconnect Prisma Client
    await db.$disconnect();
  }
}

// Run the cleanup
cleanupTempUploads(); 
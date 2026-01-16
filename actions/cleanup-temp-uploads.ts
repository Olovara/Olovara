'use server';

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function cleanupTempUploads(productId: string, fileUrls: string[]) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      console.error('[ERROR] Unauthorized cleanup attempt');
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;
    console.log('[DEBUG] cleanupTempUploads - User ID:', userId);

    // Find all temporary uploads for the user
    const tempUploads = await db.temporaryUpload.findMany({
      where: {
        userId: userId,
        fileUrl: {
          in: fileUrls
        }
      }
    });

    console.log('[DEBUG] cleanupTempUploads - Found temp uploads:', tempUploads.length);

    // Only proceed if we have file URLs to clean up
    if (fileUrls.length === 0) {
      console.log('[DEBUG] No file URLs provided for cleanup');
      return { success: true };
    }

    if (tempUploads.length === 0) {
      console.log('[DEBUG] No TemporaryUpload records found matching provided file URLs');
      // This is normal if files weren't uploaded through the temp upload system
      // or if they were already cleaned up
      return { success: true };
    }

    // Delete the temporary upload records since the form was successfully submitted
    // This prevents orphaned files and cleans up the temporary tracking
    const deleteResult = await db.temporaryUpload.deleteMany({
      where: {
        id: { in: tempUploads.map(upload => upload.id) }
      }
    });
    
    console.log('[DEBUG] Deleted', deleteResult.count, 'temporary upload records after successful submission');
    
    return { success: true };
  } catch (error) {
    console.error('[ERROR] cleanupTempUploads - Unexpected error:', error);
    return { success: false, error: 'Failed to clean up temporary uploads' };
  }
} 
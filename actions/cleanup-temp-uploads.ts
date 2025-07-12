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

    console.log('[DEBUG] cleanupTempUploads - Found temp uploads:', tempUploads);

    if (tempUploads.length === 0) {
      console.log('[DEBUG] No TemporaryUpload records found for files');
      
      // Try a more direct approach - find all records for this user
      const allTempUploads = await db.temporaryUpload.findMany({
        where: {
          userId: session.user.id
        }
      });
      
      console.log('[DEBUG] All TemporaryUpload records for user:', allTempUploads);
      
      // Check if any of these records have fileUrls that match our files
      const matchingUploads = allTempUploads.filter(upload => 
        fileUrls.includes(upload.fileUrl)
      );
      
      console.log('[DEBUG] Matching uploads by direct URL comparison:', matchingUploads);
      
      if (matchingUploads.length > 0) {
        // Delete the records directly since we don't need to update productId
        const deleteResult = await db.temporaryUpload.deleteMany({
          where: {
            id: { in: matchingUploads.map(upload => upload.id) }
          }
        });
        
        console.log('[DEBUG] Deleted records after direct URL comparison:', deleteResult);
      }
    } else {
      // Delete the temporary upload records since the form was successfully submitted
      // This prevents orphaned files and cleans up the temporary tracking
      const deleteResult = await db.temporaryUpload.deleteMany({
        where: {
          id: { in: tempUploads.map(upload => upload.id) }
        }
      });
      console.log('[DEBUG] deleteMany result:', deleteResult);
      console.log('[DEBUG] Deleted temporary upload records after successful submission');
    }
    
    return { success: true };
  } catch (error) {
    console.error('[ERROR] cleanupTempUploads - Unexpected error:', error);
    return { success: false, error: 'Failed to clean up temporary uploads' };
  }
} 
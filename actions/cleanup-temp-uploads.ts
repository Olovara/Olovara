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
    
    if (!fileUrls || !Array.isArray(fileUrls)) {
      console.error('[ERROR] Invalid cleanup data:', { productId, fileUrls });
      return { success: false, error: "Invalid request data" };
    }
    
    console.log('[DEBUG] Cleanup request received for product:', productId);
    console.log('[DEBUG] File URLs to process:', fileUrls);
    console.log('[DEBUG] User ID:', session.user.id);
    
    // First try to find records by fileUrl
    let tempUploads = await db.temporaryUpload.findMany({
      where: {
        fileUrl: { in: fileUrls },
        userId: session.user.id
      }
    });
    
    console.log('[DEBUG] Found TemporaryUpload records by fileUrl:', tempUploads);
    
    // If no records found by fileUrl, try a more direct approach
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
      // Delete the records directly
      const deleteResult = await db.temporaryUpload.deleteMany({
        where: {
          id: { in: tempUploads.map(upload => upload.id) }
        }
      });
      console.log('[DEBUG] deleteMany result:', deleteResult);
      console.log('[DEBUG] Deleted records after association');
    }
    
    return { success: true };
  } catch (error) {
    console.error('[ERROR] Cleanup failed:', error);
    return { success: false, error: "Internal Server Error" };
  }
} 
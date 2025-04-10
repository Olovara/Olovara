import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function PATCH(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const data = await req.json();
    console.log('[API INPUT] Received update data:', data);

    const { id, ...updateData } = data;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: "Product ID is required" }),
        { status: 400 }
      );
    }

    // --- Step 1: Fetch CURRENT product state BEFORE update --- 
    const currentProduct = await db.product.findUnique({
      where: { id: id, userId: session.user.id }, // Also verify ownership here
      select: { images: true, productFile: true }
    });

    if (!currentProduct) {
      return new Response(
        JSON.stringify({ success: false, error: "Product not found or not owned by user" }),
        { status: 404 }
      );
    }
    console.log('[DEBUG] currentProduct.images (before update):', currentProduct.images);

    // --- Step 2: Handle Image Deletion --- 
    if (updateData.images && Array.isArray(updateData.images)) {
      console.log('[DEBUG] updateData.images (incoming):', updateData.images);
      
      const removedImages = currentProduct.images.filter(
        (img: string) => !updateData.images.includes(img)
      );
      console.log('[DEBUG] Calculated removedImages:', removedImages);

      if (removedImages.length > 0) {
        try {
          const removedFileKeys = removedImages.map(url => url.substring(url.lastIndexOf('/') + 1));
          console.log('[DEBUG] Attempting to delete fileKeys:', removedFileKeys);
          await utapi.deleteFiles(removedFileKeys);
          console.log('[DEBUG] Successfully deleted files from UploadThing');
          
          // Delete the TemporaryUpload records for removed images
          await db.temporaryUpload.deleteMany({
            where: {
              fileUrl: { in: removedImages },
              userId: session.user.id
            }
          });
          console.log('[DEBUG] Successfully deleted TemporaryUpload records for removed images');
        } catch (deleteError) {
          console.error("[ERROR] Failed to delete files from UploadThing:", deleteError);
          // Optional: Decide if you want to return an error here if deletion fails
        }
      }
    } 
    
    // Handle productFile deletion if needed
    if (updateData.productFile !== currentProduct.productFile) {
      if (currentProduct.productFile) {
        try {
          const removedFileKey = currentProduct.productFile.substring(currentProduct.productFile.lastIndexOf('/') + 1);
          console.log('[DEBUG] Attempting to delete productFile:', removedFileKey);
          await utapi.deleteFiles([removedFileKey]);
          console.log('[DEBUG] Successfully deleted productFile from UploadThing');
          
          // Delete the TemporaryUpload record for the removed productFile
          await db.temporaryUpload.deleteMany({
            where: {
              fileUrl: currentProduct.productFile,
              userId: session.user.id
            }
          });
          console.log('[DEBUG] Successfully deleted TemporaryUpload record for removed productFile');
        } catch (deleteError) {
          console.error("[ERROR] Failed to delete productFile from UploadThing:", deleteError);
        }
      }
    }

    // --- Step 3: Prepare clean data for update (including CORRECT images array) --- 
    const cleanData = {
      ...updateData,
      // Ensure images array from the input data is used for the update
      images: updateData.images, 
      dropDate: updateData.dropDate ? new Date(updateData.dropDate) : null,
      discountEndDate: updateData.discountEndDate 
        ? new Date(updateData.discountEndDate) 
        : null,
      price: Number(updateData.price),
      stock: Number(updateData.stock),
      shippingCost: Number(updateData.shippingCost),
      handlingFee: Number(updateData.handlingFee),
      discount: updateData.discount ? Number(updateData.discount) : null,
      // Explicitly exclude fields that shouldn't be directly updated if necessary
    };
    console.log('[PRE-UPDATE] Data prepared for db.product.update:', cleanData);


    // --- Step 4: Update the product in the database ---
    const result = await db.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: cleanData,
      });

      console.log('[DEBUG] Product updated successfully:', product.id);
      return product;
    });

    return new Response(
      JSON.stringify({ success: true, product: result }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating product:', error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UTApi } from "uploadthing/server";
import { hasPermission } from "@/lib/permissions";
import { Permission } from "@/data/roles-and-permissions";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

const utapi = new UTApi();

export async function PATCH(req: Request) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let data: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const canEditProducts = await hasPermission(
      session.user.id,
      "EDIT_PRODUCTS" as Permission
    );
    if (!canEditProducts) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "You don't have permission to edit products.",
        }),
        { status: 403 }
      );
    }

    data = await req.json();
    console.log("[API INPUT] Received update data:", data);

    const { id, ...updateData } = data;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: "Product ID is required" }),
        { status: 400 }
      );
    }

    // --- Step 1: Fetch CURRENT product state BEFORE update ---
    const currentProduct = await db.product.findUnique({
      where: { id: id }, // Ownership is checked by permission, so we can simplify this
      select: { images: true, productFile: true },
    });

    if (!currentProduct) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Product not found or not owned by user",
        }),
        { status: 404 }
      );
    }
    console.log(
      "[DEBUG] currentProduct.images (before update):",
      currentProduct.images
    );

    // --- Step 2: Handle Image Deletion ---
    if (updateData.images && Array.isArray(updateData.images)) {
      console.log("[DEBUG] updateData.images (incoming):", updateData.images);

      const removedImages = currentProduct.images.filter(
        (img: string) => !updateData.images.includes(img)
      );
      console.log("[DEBUG] Calculated removedImages:", removedImages);

      if (removedImages.length > 0) {
        try {
          const removedFileKeys = removedImages.map((url) =>
            url.substring(url.lastIndexOf("/") + 1)
          );
          console.log(
            "[DEBUG] Attempting to delete fileKeys:",
            removedFileKeys
          );
          await utapi.deleteFiles(removedFileKeys);
          console.log("[DEBUG] Successfully deleted files from UploadThing");

          // Delete the TemporaryUpload records for removed images
          await db.temporaryUpload.deleteMany({
            where: {
              fileUrl: { in: removedImages },
              userId: session.user.id,
            },
          });
          console.log(
            "[DEBUG] Successfully deleted TemporaryUpload records for removed images"
          );
        } catch (deleteError) {
          console.error(
            "[ERROR] Failed to delete files from UploadThing:",
            deleteError
          );
          // Optional: Decide if you want to return an error here if deletion fails
        }
      }
    }

    // Handle productFile deletion if needed
    if (updateData.productFile !== currentProduct.productFile) {
      if (currentProduct.productFile) {
        try {
          const removedFileKey = currentProduct.productFile.substring(
            currentProduct.productFile.lastIndexOf("/") + 1
          );
          console.log(
            "[DEBUG] Attempting to delete productFile:",
            removedFileKey
          );
          await utapi.deleteFiles([removedFileKey]);
          console.log(
            "[DEBUG] Successfully deleted productFile from UploadThing"
          );

          // Delete the TemporaryUpload record for the removed productFile
          await db.temporaryUpload.deleteMany({
            where: {
              fileUrl: currentProduct.productFile,
              userId: session.user.id,
            },
          });
          console.log(
            "[DEBUG] Successfully deleted TemporaryUpload record for removed productFile"
          );
        } catch (deleteError) {
          console.error(
            "[ERROR] Failed to delete productFile from UploadThing:",
            deleteError
          );
        }
      }
    }

    // --- Step 3: Prepare clean data for update (including CORRECT images array) ---
    const cleanData = {
      ...updateData,
      // Ensure images array from the input data is used for the update
      images: updateData.images,
      dropDate: updateData.dropDate ? new Date(updateData.dropDate) : null,
      dropTime: updateData.dropTime || null,
      price: Number(updateData.price),
      currency: updateData.currency || "USD",
      stock: Number(updateData.stock),
      shippingCost: Number(updateData.shippingCost),
      handlingFee: Number(updateData.handlingFee),
      discount: updateData.discount ? Number(updateData.discount) : null,
      // Handle tertiary category (can be null/undefined)
      tertiaryCategory: updateData.tertiaryCategory || null,
      // Explicitly exclude fields that shouldn't be directly updated if necessary
    };
    console.log("[PRE-UPDATE] Data prepared for db.product.update:", cleanData);

    // --- Step 4: Update the product in the database ---
    const result = await db.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: cleanData,
      });

      console.log("[DEBUG] Product updated successfully:", product.id);
      return product;
    });

    return new Response(JSON.stringify({ success: true, product: result }), {
      status: 200,
    });
  } catch (error) {
    // Log to console (existing behavior)
    console.error("[API ERROR] Product edit failed:", {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
      productId: data?.id,
      userId: session?.user?.id || "unknown",
      updateData: {
        name: data?.name,
        status: data?.status,
        isDigital: data?.isDigital,
        price: data?.price,
        imagesCount: data?.images?.length || 0,
        hasProductFile: !!data?.productFile,
      },
      timestamp: new Date().toISOString(),
    });

    // Log to error database
    const userMessage = logError({
      code: "PRODUCT_UPDATE_FAILED",
      userId: session?.user?.id,
      route: "/api/products/edit-product",
      method: "PATCH",
      error,
      metadata: {
        productId: data?.id,
        updateData: {
          name: data?.name,
          status: data?.status,
          isDigital: data?.isDigital,
          price: data?.price,
          imagesCount: data?.images?.length || 0,
          hasProductFile: !!data?.productFile,
        },
      },
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: userMessage,
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.stack
              : String(error)
            : undefined,
      }),
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const product = await db.product.findUnique({
      where: { id: params.id },
      include: {
        seller: {
          select: {
            id: true,
            connectedAccountId: true,
            userId: true,
          },
        },
      },
    });

    if (!product) {
      return new NextResponse("Product not found", { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("[PRODUCT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
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

    const { id } = params;
    const updateData = data;

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

    // --- Step 2: Handle Image Deletion --- 
    if (updateData.images && Array.isArray(updateData.images)) {
      const removedImages = currentProduct.images.filter(
        (img: string) => !updateData.images.includes(img)
      );

      if (removedImages.length > 0) {
        try {
          const removedFileKeys = removedImages.map(url => url.substring(url.lastIndexOf('/') + 1));
          await utapi.deleteFiles(removedFileKeys);
          
          // Delete the TemporaryUpload records for removed images
          await db.temporaryUpload.deleteMany({
            where: {
              fileUrl: { in: removedImages },
              userId: session.user.id
            }
          });
        } catch (deleteError) {
          console.error("[ERROR] Failed to delete files from UploadThing:", deleteError);
        }
      }
    } 
    
    // Handle productFile deletion if needed
    if (updateData.productFile !== currentProduct.productFile) {
      if (currentProduct.productFile) {
        try {
          const removedFileKey = currentProduct.productFile.substring(currentProduct.productFile.lastIndexOf('/') + 1);
          await utapi.deleteFiles([removedFileKey]);
          
          // Delete the TemporaryUpload record for the removed productFile
          await db.temporaryUpload.deleteMany({
            where: {
              fileUrl: currentProduct.productFile,
              userId: session.user.id
            }
          });
        } catch (deleteError) {
          console.error("[ERROR] Failed to delete productFile from UploadThing:", deleteError);
        }
      }
    }

    // --- Step 3: Prepare clean data for update --- 
    const cleanData = {
      ...updateData,
      images: updateData.images, 
      dropDate: updateData.dropDate ? new Date(updateData.dropDate) : null,
      dropTime: updateData.dropTime || null,
      discountEndDate: updateData.discountEndDate 
        ? new Date(updateData.discountEndDate) 
        : null,
      price: Number(updateData.price),
      stock: Number(updateData.stock),
      shippingCost: Number(updateData.shippingCost),
      handlingFee: Number(updateData.handlingFee),
      discount: updateData.discount ? Number(updateData.discount) : null,
    };

    // --- Step 4: Update the product in the database ---
    const result = await db.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: cleanData,
      });

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
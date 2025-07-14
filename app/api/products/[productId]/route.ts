import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UTApi } from "uploadthing/server";
import { ObjectId } from "mongodb";
import { z } from "zod";

const utapi = new UTApi();

// Schema for updating product sales
const updateProductSaleSchema = z.object({
  onSale: z.boolean().optional(),
  discount: z.number().min(0).max(100).optional(),
  saleStartDate: z.string().optional(), // ISO date string
  saleEndDate: z.string().optional(), // ISO date string
  saleStartTime: z.string().optional(),
  saleEndTime: z.string().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Validate that the ID is a valid ObjectID before querying
    if (!ObjectId.isValid(params.productId)) {
      return new NextResponse("Invalid product ID format", { status: 400 });
    }

    const product = await db.product.findUnique({
      where: { id: params.productId },
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

export async function PATCH(req: Request, { params }: { params: { productId: string } }) {
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

    const { productId } = params;
    const updateData = data;

    if (!productId) {
      return new Response(
        JSON.stringify({ success: false, error: "Product ID is required" }),
        { status: 400 }
      );
    }

    // Check if this is a sale-only update
    const isSaleUpdate = Object.keys(data).every(key => 
      ['onSale', 'discount', 'saleStartDate', 'saleEndDate', 'saleStartTime', 'saleEndTime'].includes(key)
    );

    if (isSaleUpdate) {
      // Handle sale-only updates
      try {
        const validatedData = updateProductSaleSchema.parse(data);
        
        // Get the product to check ownership
        const product = await db.product.findUnique({
          where: { id: productId, userId: session.user.id },
        });

        if (!product) {
          return new Response(
            JSON.stringify({ success: false, error: "Product not found or not owned by user" }),
            { status: 404 }
          );
        }

        // Prepare update data
        const saleUpdateData: any = { ...validatedData };
        
        // Convert date strings to Date objects if provided
        if (validatedData.saleStartDate) {
          saleUpdateData.saleStartDate = new Date(validatedData.saleStartDate);
        }
        if (validatedData.saleEndDate) {
          saleUpdateData.saleEndDate = new Date(validatedData.saleEndDate);
        }

        // If turning off sale, clear sale-related fields
        if (validatedData.onSale === false) {
          saleUpdateData.discount = null;
          saleUpdateData.saleStartDate = null;
          saleUpdateData.saleEndDate = null;
          saleUpdateData.saleStartTime = null;
          saleUpdateData.saleEndTime = null;
        }

        // Update the product
        const updatedProduct = await db.product.update({
          where: { id: productId },
          data: saleUpdateData,
        });

        return new Response(
          JSON.stringify({ success: true, product: updatedProduct }),
          { status: 200 }
        );
      } catch (error) {
        if (error instanceof z.ZodError) {
          return new Response(
            JSON.stringify({ success: false, error: "Invalid sale data", details: error.errors }),
            { status: 400 }
          );
        }
        throw error;
      }
    }

    // --- Step 1: Fetch CURRENT product state BEFORE update --- 
    const currentProduct = await db.product.findUnique({
      where: { id: productId, userId: session.user.id }, // Also verify ownership here
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

    // --- Step 3: Update the product ---
    const updatedProduct = await db.product.update({
      where: { id: productId },
      data: updateData,
    });

    return new Response(
      JSON.stringify({ success: true, product: updatedProduct }),
      { status: 200 }
    );
  } catch (error) {
    console.error("[PRODUCT_PATCH]", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500 }
    );
  }
} 
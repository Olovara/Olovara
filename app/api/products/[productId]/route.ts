import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UTApi } from "uploadthing/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import {
  generateBatchNumber,
  hasGPSRFieldsChanged,
  hasStockIncreased,
} from "@/lib/batchNumber";

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
      select: {
        id: true,
        userId: true,
        name: true,
        sku: true,
        description: true,
        shortDescription: true,
        shortDescriptionBullets: true,
        price: true,
        currency: true,
        status: true,
        images: true,
        isDigital: true,
        stock: true,
        productFile: true,
        numberSold: true,
        primaryCategory: true,
        secondaryCategory: true,
        tertiaryCategory: true,
        tags: true,
        materialTags: true,
        options: true, // Explicitly include options field
        onSale: true,
        freeShipping: true,
        NSFW: true,
        isTestProduct: true,
        productDrop: true,
        dropDate: true,
        dropTime: true,
        batchNumber: true,
        shippingCost: true,
        handlingFee: true,
        itemWeight: true,
        itemWeightUnit: true,
        itemLength: true,
        itemWidth: true,
        itemHeight: true,
        itemDimensionUnit: true,
        shippingNotes: true,
        inStockProcessingTime: true,
        outStockLeadTime: true,
        shippingOptionId: true,
        taxCategory: true,
        taxCode: true,
        taxExempt: true,
        discount: true, // This is the correct field name, not discountPercentage
        saleStartDate: true,
        saleEndDate: true,
        saleStartTime: true,
        saleEndTime: true,
        originalPrice: true,
        howItsMade: true,
        safetyWarnings: true,
        materialsComposition: true,
        safeUseInstructions: true,
        ageRestriction: true,
        chokingHazard: true,
        smallPartsWarning: true,
        chemicalWarnings: true,
        careInstructions: true,
        metaTitle: true,
        metaDescription: true,
        keywords: true,
        ogTitle: true,
        ogDescription: true,
        ogImage: true,
        createdAt: true,
        updatedAt: true,
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
    console.error("[API ERROR] Product GET failed:", {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
      productId: params?.productId,
      timestamp: new Date().toISOString(),
    });
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { productId: string } }
) {
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

    data = await req.json();
    console.log("[API INPUT] Received update data:", data);

    const { productId } = params;
    const updateData = data;

    // Check seller approval if trying to set status to ACTIVE
    if (updateData.status === "ACTIVE") {
      const seller = await db.seller.findUnique({
        where: { userId: session.user.id },
        select: {
          applicationAccepted: true,
          isFullyActivated: true,
        },
      });

      if (!seller?.applicationAccepted) {
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "Your seller application must be approved before you can set products to Active status. You can still create products as Draft or Hidden while waiting for approval.",
            approvalRequired: true,
          }),
          { status: 403 }
        );
      }

      if (!seller.isFullyActivated) {
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "You must complete your seller onboarding before setting products to Active status.",
            onboardingIncomplete: true,
          }),
          { status: 403 }
        );
      }
    }

    if (!productId) {
      return new Response(
        JSON.stringify({ success: false, error: "Product ID is required" }),
        { status: 400 }
      );
    }

    // Check if this is a sale-only update
    const isSaleUpdate = Object.keys(data).every((key) =>
      [
        "onSale",
        "discount",
        "saleStartDate",
        "saleEndDate",
        "saleStartTime",
        "saleEndTime",
      ].includes(key)
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
            JSON.stringify({
              success: false,
              error: "Product not found or not owned by user",
            }),
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
            JSON.stringify({
              success: false,
              error: "Invalid sale data",
              details: error.errors,
            }),
            { status: 400 }
          );
        }
        throw error;
      }
    }

    // --- Step 1: Fetch CURRENT product state BEFORE update ---
    const currentProduct = await db.product.findUnique({
      where: { id: productId, userId: session.user.id }, // Also verify ownership here
      select: {
        images: true,
        productFile: true,
        stock: true,
        isDigital: true,
        safetyWarnings: true,
        materialsComposition: true,
        safeUseInstructions: true,
        ageRestriction: true,
        chokingHazard: true,
        smallPartsWarning: true,
        chemicalWarnings: true,
        careInstructions: true,
      },
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

    // --- Step 1.5: Check if batch number needs to be updated ---
    let shouldUpdateBatchNumber = false;

    // Check if stock has increased (for physical products only)
    if (!currentProduct.isDigital && updateData.stock !== undefined) {
      if (hasStockIncreased(currentProduct.stock, updateData.stock)) {
        shouldUpdateBatchNumber = true;
        console.log("[API] Stock increased, will update batch number");
      }
    }

    // Check if GPSR fields have changed (for physical products only)
    if (!currentProduct.isDigital) {
      if (hasGPSRFieldsChanged(currentProduct, updateData)) {
        shouldUpdateBatchNumber = true;
        console.log("[API] GPSR fields changed, will update batch number");
      }
    }

    // Generate new batch number if needed
    let newBatchNumber: string | undefined;
    if (shouldUpdateBatchNumber) {
      newBatchNumber = await generateBatchNumber(productId);
      console.log("[API] Generated new batch number:", newBatchNumber);
    }

    // --- Step 2: Handle Image Deletion ---
    if (updateData.images && Array.isArray(updateData.images)) {
      const removedImages = currentProduct.images.filter(
        (img: string) => !updateData.images.includes(img)
      );

      if (removedImages.length > 0) {
        try {
          const removedFileKeys = removedImages.map((url) =>
            url.substring(url.lastIndexOf("/") + 1)
          );
          await utapi.deleteFiles(removedFileKeys);

          // Delete the TemporaryUpload records for removed images
          await db.temporaryUpload.deleteMany({
            where: {
              fileUrl: { in: removedImages },
              userId: session.user.id,
            },
          });
        } catch (deleteError) {
          console.error(
            "[ERROR] Failed to delete files from UploadThing:",
            deleteError
          );
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
          await utapi.deleteFiles([removedFileKey]);

          // Delete the TemporaryUpload record for the removed productFile
          await db.temporaryUpload.deleteMany({
            where: {
              fileUrl: currentProduct.productFile,
              userId: session.user.id,
            },
          });
        } catch (deleteError) {
          console.error(
            "[ERROR] Failed to delete productFile from UploadThing:",
            deleteError
          );
        }
      }
    }

    // --- Step 3: Update the product ---
    console.log(
      "[API] About to update product with data:",
      JSON.stringify(updateData, null, 2)
    );

    // Split the update into smaller chunks to avoid MongoDB Atlas pipeline limit
    // Group fields by category to reduce pipeline length
    const basicFields = {
      name: updateData.name,
      sku: updateData.sku,
      shortDescription: updateData.shortDescription ?? "",
      shortDescriptionBullets: updateData.shortDescriptionBullets ?? [],
      description: updateData.description,
      price: updateData.price,
      currency: updateData.currency,
      status: updateData.status,
      images: updateData.images,
      isDigital: updateData.isDigital,
      stock: updateData.stock,
      productFile: updateData.productFile,
      numberSold: updateData.numberSold,
      primaryCategory: updateData.primaryCategory,
      secondaryCategory: updateData.secondaryCategory,
      tertiaryCategory: updateData.tertiaryCategory,
      tags: updateData.tags,
      materialTags: updateData.materialTags,
      options: updateData.options, // Add options field
      onSale: updateData.onSale,
      freeShipping: updateData.freeShipping,
      NSFW: updateData.NSFW,
      isTestProduct: updateData.isTestProduct,
      productDrop: updateData.productDrop,
      dropDate: updateData.dropDate,
      dropTime: updateData.dropTime,
      batchNumber: newBatchNumber, // Add batch number if generated
    };

    const shippingFields = {
      shippingCost: updateData.shippingCost,
      handlingFee: updateData.handlingFee,
      itemWeight: updateData.itemWeight,
      itemWeightUnit: updateData.itemWeightUnit,
      itemLength: updateData.itemLength,
      itemWidth: updateData.itemWidth,
      itemHeight: updateData.itemHeight,
      itemDimensionUnit: updateData.itemDimensionUnit,
      shippingNotes: updateData.shippingNotes,
      inStockProcessingTime: updateData.inStockProcessingTime,
      outStockLeadTime: updateData.outStockLeadTime,
      shippingOptionId: updateData.shippingOptionId,
    };

    const taxFields = {
      taxCategory: updateData.taxCategory,
      // Convert empty string to null for taxCode (it's optional and nullable)
      taxCode: updateData.taxCode && updateData.taxCode.trim() !== "" ? updateData.taxCode : null,
      taxExempt: updateData.taxExempt,
    };

    const seoFields = {
      metaTitle: updateData.metaTitle,
      metaDescription: updateData.metaDescription,
      keywords: updateData.keywords,
      ogTitle: updateData.ogTitle,
      ogDescription: updateData.ogDescription,
      ogImage: updateData.ogImage,
    };

    const gpsrFields = {
      safetyWarnings: updateData.safetyWarnings,
      materialsComposition: updateData.materialsComposition,
      safeUseInstructions: updateData.safeUseInstructions,
      ageRestriction: updateData.ageRestriction,
      chokingHazard: updateData.chokingHazard,
      smallPartsWarning: updateData.smallPartsWarning,
      chemicalWarnings: updateData.chemicalWarnings,
      careInstructions: updateData.careInstructions,
    };

    const otherFields = {
      howItsMade: updateData.howItsMade,
    };

    // Filter out undefined values from each group
    const filterUndefined = (obj: any) =>
      Object.fromEntries(
        Object.entries(obj).filter(([_, value]) => value !== undefined)
      );

    const updateGroups = [
      filterUndefined(basicFields),
      filterUndefined(shippingFields),
      filterUndefined(taxFields),
      filterUndefined(seoFields),
      filterUndefined(gpsrFields),
      filterUndefined(otherFields),
    ].filter((group) => Object.keys(group).length > 0);

    console.log(
      "[API] Update groups:",
      updateGroups.map((group) => ({
        fields: Object.keys(group),
        count: Object.keys(group).length,
      }))
    );

    let updatedProduct: any;
    try {
      // Perform multiple smaller updates to avoid MongoDB Atlas pipeline limit
      console.log(
        "[API] Performing chunked updates to avoid pipeline limit..."
      );

      // Update in chunks of max 40 fields to stay well under the 50 limit
      const MAX_FIELDS_PER_UPDATE = 40;

      // Combine all groups and split into chunks
      const allFields = Object.assign({}, ...updateGroups);
      const fieldEntries = Object.entries(allFields);
      const chunks = [];

      for (let i = 0; i < fieldEntries.length; i += MAX_FIELDS_PER_UPDATE) {
        chunks.push(
          Object.fromEntries(fieldEntries.slice(i, i + MAX_FIELDS_PER_UPDATE))
        );
      }

      console.log(
        "[API] Split into",
        chunks.length,
        "chunks:",
        chunks.map((chunk) => ({
          fields: Object.keys(chunk),
          count: Object.keys(chunk).length,
        }))
      );

      // Perform updates sequentially
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(
          `[API] Updating chunk ${i + 1}/${chunks.length} with ${Object.keys(chunk).length} fields`
        );

        updatedProduct = await db.product.update({
          where: { id: productId },
          data: chunk,
        });

        console.log(`[API] Chunk ${i + 1} updated successfully`);
      }

      console.log("[API] All chunks updated successfully:", updatedProduct.id);
    } catch (dbError) {
      console.error("[API] Database update error:", dbError);
      throw dbError;
    }

    return new Response(
      JSON.stringify({ success: true, product: updatedProduct }),
      { status: 200 }
    );
  } catch (error) {
    console.error("[API ERROR] Product PATCH failed:", {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
      productId: params?.productId,
      userId: session?.user?.id || "unknown",
      updateData: {
        status: data?.status,
        name: data?.name,
        isDigital: data?.isDigital,
        price: data?.price,
        imagesCount: data?.images?.length || 0,
        hasProductFile: !!data?.productFile,
      },
      timestamp: new Date().toISOString(),
    });
    
    // Check if it's a ZodError
    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as { issues: Array<{ message: string; path: (string | number)[] }> };
      return new Response(
        JSON.stringify({
          success: false,
          error: "Validation failed",
          details: zodError.issues,
        }),
        { status: 400 }
      );
    }
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Internal server error";
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === "development" 
          ? (error instanceof Error ? error.stack : String(error))
          : undefined,
      }),
      { status: 500 }
    );
  }
}

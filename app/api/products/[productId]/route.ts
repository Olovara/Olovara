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
import { logError } from "@/lib/error-logger";
import { logQaEvent } from "@/lib/qa-logger";
import { QA_EVENTS, PRODUCT_STEPS } from "@/lib/qa-steps";
import { hasPermission } from "@/lib/permissions";
import { Permission } from "@/data/roles-and-permissions";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = "force-dynamic";

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
  let session: any = null;
  try {
    session = await auth();
    if (!session?.user?.id) {
      // Expected security check - no DB logging needed
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Validate that the ID is a valid ObjectID before querying
    if (!ObjectId.isValid(params.productId)) {
      // Expected validation - no DB logging needed
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
        tags: true,
        materialTags: true,
        attributes: true, // Include attributes field
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
      // Expected - product may not exist - no DB logging needed
      return new NextResponse("Product not found", { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    // Log unexpected errors to both console and database
    console.error("[API ERROR] Product GET failed:", {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
      productId: params?.productId,
      timestamp: new Date().toISOString(),
    });

    // Log to database
    const userMessage = logError({
      code: "PRODUCT_FETCH_FAILED",
      userId: session?.user?.id,
      route: `/api/products/${params?.productId}`,
      method: "GET",
      error,
      metadata: {
        productId: params?.productId,
        note: "Unexpected error fetching product",
      },
    });

    return new NextResponse(JSON.stringify({ error: userMessage }), {
      status: 500,
    });
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
      // Expected security check - no DB logging needed
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401 }
      );
    }

    // Get QA session ID from header
    const qaSessionId = req.headers.get("x-qa-session-id") || "";

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
        // Expected business logic - no DB logging needed
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
        // Expected business logic - no DB logging needed
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
      // Expected validation - no DB logging needed
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
          // Expected - product may not exist or user doesn't own it - no DB logging needed
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

        // QA logging: Log successful sale update
        logQaEvent({
          userId: session.user.id,
          sessionId: qaSessionId,
          event: QA_EVENTS.PRODUCT_EDIT,
          step: "sale_update",
          status: "completed",
          route: `/api/products/${productId}`,
          metadata: {
            productId: updatedProduct.id,
            onSale: updatedProduct.onSale,
          },
        });

        return new Response(
          JSON.stringify({ success: true, product: updatedProduct }),
          { status: 200 }
        );
      } catch (error) {
        if (error instanceof z.ZodError) {
          // Expected validation - no DB logging needed
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
      // Expected - product may not exist or user doesn't own it - no DB logging needed
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
        // Calculate file keys outside try block so they're accessible in catch
        const removedFileKeys = removedImages.map((url) =>
          url.substring(url.lastIndexOf("/") + 1)
        );

        try {
          await utapi.deleteFiles(removedFileKeys);

          // Delete the TemporaryUpload records for removed images
          await db.temporaryUpload.deleteMany({
            where: {
              fileUrl: { in: removedImages },
              userId: session.user.id,
            },
          });
        } catch (deleteError) {
          // Log file deletion failure - this is important for cleanup tracking
          logError({
            code: "PRODUCT_UPDATE_FILE_DELETE_FAILED",
            userId: session.user.id,
            route: `/api/products/${productId}`,
            method: "PATCH",
            error: deleteError,
            metadata: {
              productId,
              removedImages,
              removedFileKeys,
              note: "Failed to delete removed images from UploadThing",
            },
          });
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
        // Calculate file key outside try block so it's accessible in catch
        const removedFileKey = currentProduct.productFile.substring(
          currentProduct.productFile.lastIndexOf("/") + 1
        );

        try {
          await utapi.deleteFiles([removedFileKey]);

          // Delete the TemporaryUpload record for the removed productFile
          await db.temporaryUpload.deleteMany({
            where: {
              fileUrl: currentProduct.productFile,
              userId: session.user.id,
            },
          });
        } catch (deleteError) {
          // Log product file deletion failure
          logError({
            code: "PRODUCT_UPDATE_PRODUCT_FILE_DELETE_FAILED",
            userId: session.user.id,
            route: `/api/products/${productId}`,
            method: "PATCH",
            error: deleteError,
            metadata: {
              productId,
              removedFileKey,
              oldProductFile: currentProduct.productFile,
              note: "Failed to delete product file from UploadThing",
            },
          });
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
      tags: updateData.tags,
      materialTags: updateData.materialTags,
      options: updateData.options, // Add options field
      onSale: updateData.onSale,
      discount: updateData.discount,
      saleStartDate: updateData.saleStartDate,
      saleEndDate: updateData.saleEndDate,
      saleStartTime: updateData.saleStartTime,
      saleEndTime: updateData.saleEndTime,
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
      // Note: shippingOptionId is handled separately below to avoid Prisma relation issues
    };

    const taxFields = {
      taxCategory: updateData.taxCategory,
      // Convert empty string to null for taxCode (it's optional and nullable)
      taxCode:
        updateData.taxCode && updateData.taxCode.trim() !== ""
          ? updateData.taxCode
          : null,
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
      // Note: attributes is handled separately below to avoid Prisma issues
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
    // Declare chunks outside try block so it's accessible in catch
    let chunks: any[] = [];
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
      chunks = [];

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

      // Handle attributes separately (if provided)
      // This ensures Prisma recognizes the field even if client is slightly out of sync
      if (updateData.attributes !== undefined) {
        updatedProduct = await db.product.update({
          where: { id: productId },
          data: { attributes: updateData.attributes || null },
        });

        console.log("[API] Attributes updated successfully");
      }

      // Handle shippingOptionId separately using relation syntax (if provided)
      // Prisma requires relation syntax for relation fields in updates
      if (updateData.shippingOptionId !== undefined) {
        const shippingOptionUpdate: any = updateData.shippingOptionId
          ? { connect: { id: updateData.shippingOptionId } }
          : { disconnect: true };

        updatedProduct = await db.product.update({
          where: { id: productId },
          data: { shippingOption: shippingOptionUpdate },
        });

        console.log("[API] Shipping option updated successfully");
      }
    } catch (dbError) {
      // Log database update errors
      console.error("[API] Database update error:", dbError);
      logError({
        code: "PRODUCT_UPDATE_DB_ERROR",
        userId: session.user.id,
        route: `/api/products/${productId}`,
        method: "PATCH",
        error: dbError,
        metadata: {
          productId,
          updateGroups: updateGroups.map((group) => ({
            fields: Object.keys(group),
            count: Object.keys(group).length,
          })),
          chunksCount: chunks.length,
          note: "Database update failed during chunked update",
        },
      });
      throw dbError;
    }

    // QA logging: Log successful product update
    logQaEvent({
      userId: session.user.id,
      sessionId: qaSessionId,
      event: QA_EVENTS.PRODUCT_EDIT,
      step: PRODUCT_STEPS.SUBMIT,
      status: "completed",
      route: `/api/products/${productId}`,
      metadata: {
        productId: updatedProduct.id,
        isDraft: updatedProduct.status === "DRAFT",
        isDigital: updatedProduct.isDigital,
        imageCount: updatedProduct.images?.length || 0,
        hasProductFile: !!updatedProduct.productFile,
      },
    });

    // Finalize uploads (prevent cron cleanup from deleting real product assets)
    // UploadThing writes `TemporaryUpload` rows during upload. If those rows remain after save,
    // the cleanup job may delete the underlying files later (causing utfs.io 404s).
    try {
      const fileUrlsToFinalize = [
        ...(Array.isArray(updateData.images) ? updateData.images : []),
        ...(updateData.productFile ? [updateData.productFile] : []),
      ].filter((u): u is string => typeof u === "string" && u.length > 0);

      if (fileUrlsToFinalize.length > 0) {
        await db.temporaryUpload.deleteMany({
          where: {
            userId: session.user.id,
            fileUrl: { in: fileUrlsToFinalize },
          },
        });
      }
    } catch (finalizeError) {
      // Non-fatal, but track it because it can cause "images disappeared later" reports.
      logError({
        code: "PRODUCT_UPDATE_TEMP_UPLOAD_FINALIZE_FAILED",
        userId: session.user.id,
        route: `/api/products/${productId}`,
        method: "PATCH",
        error: finalizeError,
        metadata: {
          productId,
          imagesCount: Array.isArray(updateData.images) ? updateData.images.length : 0,
          hasProductFile: !!updateData.productFile,
          note: "Failed to delete TemporaryUpload rows after successful product update",
        },
      });
    }

    return new Response(
      JSON.stringify({ success: true, product: updatedProduct }),
      { status: 200 }
    );
  } catch (error) {
    // QA logging: Log product update failure
    const qaSessionId = req.headers.get("x-qa-session-id") || "";
    if (session?.user?.id) {
      logQaEvent({
        userId: session.user.id,
        sessionId: qaSessionId,
        event: QA_EVENTS.PRODUCT_EDIT,
        step: PRODUCT_STEPS.SUBMIT,
        status: "failed",
        route: `/api/products/${params?.productId}`,
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          productId: params?.productId,
        },
      });
    }

    // Log to console (existing behavior)
    console.error("[API ERROR] Product PATCH failed:", {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
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

    // Check if it's a ZodError (validation error)
    if (error && typeof error === "object" && "issues" in error) {
      const zodError = error as {
        issues: Array<{ message: string; path: (string | number)[] }>;
      };

      // Log validation errors to database
      logError({
        code: "PRODUCT_VALIDATION_FAILED",
        userId: session?.user?.id,
        route: `/api/products/${params?.productId}`,
        method: "PATCH",
        error,
        metadata: {
          productId: params?.productId,
          validationErrors: zodError.issues,
          updateData: {
            status: data?.status,
            name: data?.name,
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
          error: "Validation failed",
          details: zodError.issues,
        }),
        { status: 400 }
      );
    }

    // Log to database for non-validation errors
    const userMessage = logError({
      code: "PRODUCT_UPDATE_FAILED",
      userId: session?.user?.id,
      route: `/api/products/${params?.productId}`,
      method: "PATCH",
      error,
      metadata: {
        productId: params?.productId,
        updateData: {
          status: data?.status,
          name: data?.name,
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

/**
 * DELETE /api/products/[productId]
 * Deletes a product with no sales and all associated images/files
 * Only allows deletion if numberSold === 0
 */
export async function DELETE(
  req: Request,
  { params }: { params: { productId: string } }
) {
  let session: any = null;

  try {
    // Authenticate user
    session = await auth();
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401 }
      );
    }

    // Check permission to delete products
    const canDeleteProducts = await hasPermission(
      session.user.id,
      "DELETE_PRODUCTS" as Permission
    );
    if (!canDeleteProducts) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "You don't have permission to delete products.",
        }),
        { status: 403 }
      );
    }

    const { productId } = params;

    // Validate product ID format
    if (!ObjectId.isValid(productId)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid product ID format" }),
        { status: 400 }
      );
    }

    // Fetch product and verify ownership
    const product = await db.product.findUnique({
      where: { id: productId, userId: session.user.id },
      select: {
        id: true,
        name: true,
        numberSold: true,
        images: true,
        productFile: true,
        userId: true,
      },
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

    // Check if product has sales - only allow deletion if numberSold === 0
    if (product.numberSold > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Cannot delete product with sales. Products with sales cannot be deleted.",
        }),
        { status: 403 }
      );
    }

    // Collect all file keys to delete from UploadThing
    // NOTE: Bulk import should only create products with UploadThing URLs (all images are uploaded to our storage).
    // However, we check for external URLs defensively because:
    // 1. Legacy products may have been created before bulk import was fixed
    // 2. Products can be created through other means (manual creation, API) that might have external URLs
    // 3. It prevents errors if an external URL somehow slips through
    const fileKeysToDelete: string[] = [];

    // Helper function to check if URL is an UploadThing URL
    const isUploadThingUrl = (url: string): boolean => {
      if (!url || typeof url !== "string") return false;
      // UploadThing URLs typically contain "utfs.io" or "uploadthing.com"
      return (
        url.includes("utfs.io") ||
        url.includes("uploadthing.com") ||
        url.includes("uploadthing-prod.s3.us-west-2.amazonaws.com")
      );
    };

    // Helper function to extract file key from UploadThing URL
    const extractFileKey = (url: string): string | null => {
      if (!url || typeof url !== "string" || url.trim() === "") return null;
      
      // Only process UploadThing URLs
      if (!isUploadThingUrl(url)) return null;

      const lastSlashIndex = url.lastIndexOf("/");
      if (lastSlashIndex === -1) {
        // No slash found - might be just a key, but log warning
        console.warn(
          `[DELETE PRODUCT] Unexpected URL format (no slash): ${url}`
        );
        return null;
      }

      const fileKey = url.substring(lastSlashIndex + 1);
      // Remove query parameters if present
      const keyWithoutParams = fileKey.split("?")[0];
      
      if (!keyWithoutParams || keyWithoutParams.trim() === "") {
        console.warn(`[DELETE PRODUCT] Empty file key extracted from URL: ${url}`);
        return null;
      }

      return keyWithoutParams;
    };

    // Extract file keys from images array (only UploadThing URLs)
    if (
      product.images &&
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
      product.images.forEach((url: string) => {
        const fileKey = extractFileKey(url);
        if (fileKey) {
          fileKeysToDelete.push(fileKey);
        }
      });
    }

    // Extract file key from productFile if it exists (only UploadThing URLs)
    if (product.productFile) {
      const productFileKey = extractFileKey(product.productFile);
      if (productFileKey) {
        fileKeysToDelete.push(productFileKey);
      }
    }

    // Delete files from UploadThing storage
    if (fileKeysToDelete.length > 0) {
      try {
        console.log(
          `[DELETE PRODUCT] Deleting ${fileKeysToDelete.length} file(s) from UploadThing:`,
          fileKeysToDelete
        );
        await utapi.deleteFiles(fileKeysToDelete);
        console.log(
          "[DELETE PRODUCT] Successfully deleted files from UploadThing"
        );
      } catch (deleteError) {
        // Log file deletion failure but continue with product deletion
        // This ensures we don't leave orphaned product records
        logError({
          code: "PRODUCT_DELETE_FILE_DELETE_FAILED",
          userId: session.user.id,
          route: `/api/products/${productId}`,
          method: "DELETE",
          error: deleteError,
          metadata: {
            productId,
            fileKeys: fileKeysToDelete,
            note: "Failed to delete files from UploadThing, but product deletion will continue",
          },
        });
        console.error(
          "[ERROR] Failed to delete files from UploadThing:",
          deleteError
        );
      }
    }

    // Delete TemporaryUpload records associated with this product
    try {
      const allFileUrls = [
        ...(product.images || []),
        ...(product.productFile ? [product.productFile] : []),
      ];

      if (allFileUrls.length > 0) {
        await db.temporaryUpload.deleteMany({
          where: {
            fileUrl: { in: allFileUrls },
            userId: session.user.id,
          },
        });
        console.log(
          "[DELETE PRODUCT] Successfully deleted TemporaryUpload records"
        );
      }
    } catch (tempUploadError) {
      // Log but don't fail - TemporaryUpload cleanup is not critical
      console.error(
        "[WARNING] Failed to delete TemporaryUpload records:",
        tempUploadError
      );
    }

    // Delete all ProductInteraction records associated with this product
    // This is required because ProductInteraction has a required relation to Product
    // If this fails, we cannot delete the product, so we must throw the error
    try {
      // First, check if there are any ProductInteraction records
      const interactionCount = await db.productInteraction.count({
        where: { productId: productId },
      });
      
      if (interactionCount > 0) {
        const deletedInteractions = await db.productInteraction.deleteMany({
          where: { productId: productId },
        });
        console.log(
          `[DELETE PRODUCT] Successfully deleted ${deletedInteractions.count} ProductInteraction record(s)`
        );
        
        // Verify deletion succeeded
        if (deletedInteractions.count !== interactionCount) {
          console.warn(
            `[DELETE PRODUCT] Warning: Expected to delete ${interactionCount} interactions but deleted ${deletedInteractions.count}`
          );
        }
      } else {
        console.log(`[DELETE PRODUCT] No ProductInteraction records found for product ${productId}`);
      }
    } catch (interactionDeleteError) {
      // If ProductInteraction deletion fails, we cannot proceed with product deletion
      // Log the error and throw it so the deletion fails early with a clear message
      const errorMessage =
        interactionDeleteError instanceof Error
          ? interactionDeleteError.message
          : "Failed to delete ProductInteraction records";
      
      logError({
        code: "PRODUCT_DELETE_INTERACTIONS_FAILED",
        userId: session.user.id,
        route: `/api/products/${productId}`,
        method: "DELETE",
        error: interactionDeleteError,
        metadata: {
          productId,
          productName: product.name,
          note: "Failed to delete ProductInteraction records - product deletion aborted",
        },
      });
      
      throw new Error(
        `Failed to delete ProductInteraction records: ${errorMessage}. Cannot delete product until interactions are removed.`
      );
    }

    // Delete the product from database
    try {
      await db.product.delete({
        where: { id: productId },
      });
      console.log(`[DELETE PRODUCT] Successfully deleted product: ${productId}`);
    } catch (dbDeleteError) {
      // Database deletion failed - this is critical, so we should fail
      // But provide a clear error message
      const errorMessage =
        dbDeleteError instanceof Error
          ? dbDeleteError.message
          : "Database deletion failed";

      // Check if product was already deleted (race condition)
      const productStillExists = await db.product.findUnique({
        where: { id: productId },
        select: { id: true },
      });

      if (!productStillExists) {
        // Product was already deleted - treat as success (idempotent)
        console.log(
          `[DELETE PRODUCT] Product ${productId} was already deleted (race condition)`
        );
        return new Response(
          JSON.stringify({
            success: true,
            message: "Product deleted successfully",
            productId: productId,
            productName: product.name,
          }),
          { status: 200 }
        );
      }

      // Product still exists - deletion actually failed
      logError({
        code: "PRODUCT_DELETE_DB_FAILED",
        userId: session.user.id,
        route: `/api/products/${productId}`,
        method: "DELETE",
        error: dbDeleteError,
        metadata: {
          productId,
          productName: product.name,
          note: "Database deletion failed - product may have active orders or other constraints",
        },
      });

      throw new Error(
        `Failed to delete product from database: ${errorMessage}. The product may have active orders or other database constraints preventing deletion.`
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Product deleted successfully",
        productId: product.id,
        productName: product.name,
      }),
      { status: 200 }
    );
  } catch (error) {
    // Log error to database
    const userMessage = logError({
      code: "PRODUCT_DELETE_FAILED",
      userId: session?.user?.id,
      route: `/api/products/${params?.productId}`,
      method: "DELETE",
      error,
      metadata: {
        productId: params?.productId,
        note: "Unexpected error during product deletion",
      },
    });

    console.error("[API ERROR] Product DELETE failed:", {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
      productId: params?.productId,
      userId: session?.user?.id || "unknown",
      timestamp: new Date().toISOString(),
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

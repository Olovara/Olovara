import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateUniqueSKU } from "@/lib/sku-generator";
import { generateBatchNumber } from "@/lib/batchNumber";
import { ObjectId } from "mongodb";
import { Prisma } from "@prisma/client";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

/**
 * Duplicate/Copy a product
 * Creates a new product with all the same data as the original,
 * but with a new ID, SKU, and name appended with " (Copy)"
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let originalProduct: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401 }
      );
    }

    // Validate that the ID is a valid ObjectID
    if (!ObjectId.isValid(params.productId)) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Invalid product ID format" }),
        { status: 400 }
      );
    }

    // Get the original product with all fields
    originalProduct = await db.product.findUnique({
      where: { id: params.productId },
      select: {
        userId: true,
        name: true,
        sku: true,
        shortDescription: true,
        shortDescriptionBullets: true,
        description: true,
        price: true,
        currency: true,
        status: true,
        shippingCost: true,
        handlingFee: true,
        itemWeight: true,
        itemWeightUnit: true,
        itemLength: true,
        itemWidth: true,
        itemHeight: true,
        itemDimensionUnit: true,
        shippingNotes: true,
        freeShipping: true,
        isDigital: true,
        stock: true,
        images: true,
        productFile: true,
        onSale: true,
        discount: true,
        primaryCategory: true,
        secondaryCategory: true,
        tertiaryCategory: true,
        tags: true,
        materialTags: true,
        options: true,
        inStockProcessingTime: true,
        outStockLeadTime: true,
        howItsMade: true,
        productDrop: true,
        NSFW: true,
        dropDate: true,
        dropTime: true,
        saleStartDate: true,
        saleEndDate: true,
        saleStartTime: true,
        saleEndTime: true,
        originalPrice: true,
        shippingOptionId: true,
        taxCategory: true,
        taxCode: true,
        taxExempt: true,
        isTestProduct: true,
        metaTitle: true,
        metaDescription: true,
        keywords: true,
        ogTitle: true,
        ogDescription: true,
        ogImage: true,
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

    if (!originalProduct) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Product not found" }),
        { status: 404 }
      );
    }

    // Verify the user owns this product
    if (originalProduct.userId !== session.user.id) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 403 }
      );
    }

    // Generate new SKU for the duplicate
    const newSku = await generateUniqueSKU(
      originalProduct.name,
      session.user.id
    );

    // Create the duplicate product data
    // Append " (Copy)" to the name and set status to DRAFT
    const duplicateData = {
      userId: session.user.id,
      name: `${originalProduct.name} (Copy)`,
      sku: newSku,
      shortDescription: originalProduct.shortDescription,
      shortDescriptionBullets: originalProduct.shortDescriptionBullets,
      description: originalProduct.description,
      price: originalProduct.price,
      currency: originalProduct.currency,
      status: "DRAFT" as const, // Set duplicate as draft so seller can review before activating
      shippingCost: originalProduct.shippingCost,
      handlingFee: originalProduct.handlingFee,
      itemWeight: originalProduct.itemWeight,
      itemWeightUnit: originalProduct.itemWeightUnit,
      itemLength: originalProduct.itemLength,
      itemWidth: originalProduct.itemWidth,
      itemHeight: originalProduct.itemHeight,
      itemDimensionUnit: originalProduct.itemDimensionUnit,
      shippingNotes: originalProduct.shippingNotes,
      freeShipping: originalProduct.freeShipping,
      isDigital: originalProduct.isDigital,
      stock: originalProduct.stock,
      images: originalProduct.images, // Copy image URLs
      productFile: originalProduct.productFile, // Copy product file URL if digital
      numberSold: 0, // Reset sales count
      onSale: originalProduct.onSale,
      discount: originalProduct.discount,
      primaryCategory: originalProduct.primaryCategory,
      secondaryCategory: originalProduct.secondaryCategory,
      tertiaryCategory: originalProduct.tertiaryCategory,
      tags: originalProduct.tags,
      materialTags: originalProduct.materialTags,
      options: originalProduct.options,
      inStockProcessingTime: originalProduct.inStockProcessingTime,
      outStockLeadTime: originalProduct.outStockLeadTime,
      howItsMade: originalProduct.howItsMade,
      productDrop: originalProduct.productDrop,
      NSFW: originalProduct.NSFW,
      dropDate: originalProduct.dropDate,
      dropTime: originalProduct.dropTime,
      saleStartDate: originalProduct.saleStartDate,
      saleEndDate: originalProduct.saleEndDate,
      saleStartTime: originalProduct.saleStartTime,
      saleEndTime: originalProduct.saleEndTime,
      originalPrice: originalProduct.originalPrice,
      shippingOptionId: originalProduct.shippingOptionId,
      taxCategory: originalProduct.taxCategory,
      taxCode: originalProduct.taxCode,
      taxExempt: originalProduct.taxExempt,
      isTestProduct: originalProduct.isTestProduct,
      metaTitle: originalProduct.metaTitle,
      metaDescription: originalProduct.metaDescription,
      keywords: originalProduct.keywords,
      ogTitle: originalProduct.ogTitle,
      ogDescription: originalProduct.ogDescription,
      ogImage: originalProduct.ogImage,
      safetyWarnings: originalProduct.safetyWarnings,
      materialsComposition: originalProduct.materialsComposition,
      safeUseInstructions: originalProduct.safeUseInstructions,
      ageRestriction: originalProduct.ageRestriction,
      chokingHazard: originalProduct.chokingHazard,
      smallPartsWarning: originalProduct.smallPartsWarning,
      chemicalWarnings: originalProduct.chemicalWarnings,
      careInstructions: originalProduct.careInstructions,
    };

    // Create the duplicate product
    // Ensure description and options are properly typed for Prisma InputJsonValue
    const duplicatedProduct = await db.product.create({
      data: {
        ...duplicateData,
        description: (duplicateData.description || {
          html: "",
          text: "",
        }) as Prisma.InputJsonValue, // Cast to InputJsonValue
        options: (duplicateData.options ??
          null) as Prisma.InputJsonValue | null, // Cast to InputJsonValue or null
        stock: duplicateData.stock ?? undefined, // Convert null to undefined for Prisma
      },
    });

    // Generate batch number for physical products (not digital)
    if (!duplicateData.isDigital) {
      try {
        const batchNumber = await generateBatchNumber(duplicatedProduct.id);
        await db.product.update({
          where: { id: duplicatedProduct.id },
          data: { batchNumber },
        });
      } catch (error) {
        console.error("[BATCH NUMBER] Error generating batch number:", error);
        // Don't fail the entire request if batch number generation fails
      }
    }

    return new NextResponse(
      JSON.stringify({
        success: true,
        productId: duplicatedProduct.id,
        message: "Product duplicated successfully!",
      }),
      { status: 201 }
    );
  } catch (error) {
    // Log to console (existing behavior)
    console.error("[DUPLICATE_PRODUCT] Error:", error);

    // Log to error database
    const userMessage = logError({
      code: "PRODUCT_DUPLICATE_FAILED",
      userId: session?.user?.id,
      route: `/api/products/${params?.productId}/duplicate`,
      method: "POST",
      error,
      metadata: {
        originalProductId: params?.productId,
        originalProductName: originalProduct?.name,
        isDigital: originalProduct?.isDigital,
        note: "Failed to duplicate product",
      },
    });

    return new NextResponse(
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

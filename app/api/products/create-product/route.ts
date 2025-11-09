import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ProductSchema, ProductDraftSchema } from "@/schemas/ProductSchema";
import { generateUniqueSKU } from "@/lib/sku-generator";
import { getSellerOnboardingSteps } from "@/lib/onboarding";
import { generateBatchNumber } from "@/lib/batchNumber";

// 60 seconds timeout

// For body size limit, we need to use a different approach in App Router
// This will be handled in the POST function

export async function POST(req: NextRequest) {
  //console.log("API HIT: /api/products/create-product");

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized",
        }),
        { status: 401 }
      );
    }

    const data = await req.json();
    console.log("[API INPUT] Received product data:", data);

    const {
      name,
      sku,
      shortDescription,
      shortDescriptionBullets = [],
      price,
      description,
      status,
      shippingCost = 0,
      handlingFee = 0,
      itemWeight,
      itemLength,
      itemWidth,
      itemHeight,
      shippingNotes,
      freeShipping = false,
      isDigital,
      stock,
      images = [],
      productFile,
      numberSold = 0,
      onSale = false,
      discount,
      primaryCategory,
      secondaryCategory,
      tertiaryCategory,
      tags = [],
      materialTags = [],
      options,
      inStockProcessingTime,
      outStockLeadTime,
      howItsMade,
      productDrop = false,
      NSFW = false,
      dropDate,
      dropTime,
      discountEndDate,
      currency = "USD",
      isTestProduct = false,
      // SEO fields
      metaTitle,
      metaDescription,
      keywords = [],
      ogTitle,
      ogDescription,
      ogImage,
      // GPSR Compliance fields
      safetyWarnings,
      materialsComposition,
      safeUseInstructions,
      ageRestriction,
      chokingHazard,
      smallPartsWarning,
      chemicalWarnings,
      careInstructions,
    } = data;

    // Check if seller exists and get onboarding status
    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        userId: true,
        isFullyActivated: true,
        applicationAccepted: true,
      },
    });

    if (!seller) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Seller profile not found",
        }),
        { status: 404 }
      );
    }

    // Get onboarding steps for detailed status
    const onboardingSteps = await getSellerOnboardingSteps(seller.id);

    // Determine if this is a draft or active product
    const isDraft = status === "DRAFT";
    
    // If trying to create an active product, check seller approval and onboarding completion
    if (!isDraft && status === "ACTIVE") {
      // Check seller approval first
      if (!seller.applicationAccepted) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Your seller application must be approved before you can set products to Active status. You can still create products as Draft or Hidden while waiting for approval.",
            approvalRequired: true,
          }),
          { status: 403 }
        );
      }
      
      // Check onboarding completion
      if (!seller.isFullyActivated) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "You must complete your seller onboarding before creating active products. Please complete all onboarding steps first.",
            onboardingIncomplete: true,
            onboardingStatus: {
              isFullyActivated: seller.isFullyActivated,
              steps: onboardingSteps
            }
          }),
          { status: 403 }
        );
      }
    }

    // Basic validation for required fields
    if (!name || !price || !primaryCategory) {
      console.warn("Missing required fields:", {
        name,
        price,
        primaryCategory,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Required fields are missing",
        }),
        { status: 400 }
      );
    }

    //console.log("Creating product with sanitized data...");

    // --- Step 1: Generate SKU if not provided ---
    let finalSku = sku;
    if (!sku || sku.trim() === "") {
      try {
        finalSku = await generateUniqueSKU(name, seller.userId);
        console.log("[SKU GENERATION] Generated SKU:", finalSku);
      } catch (error) {
        console.error("[SKU GENERATION] Error generating SKU:", error);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to generate SKU",
          }),
          { status: 500 }
        );
      }
    }

    // --- Step 2: Prepare clean data for product creation ---
    const productData = {
      userId: session.user.id,
      name: name.trim(),
      sku: finalSku,
      shortDescription: shortDescription || "",
      shortDescriptionBullets: shortDescriptionBullets || [],
      description: description || { html: "", text: "" },
      price, // Price is already converted to cents by ProductSchema
      currency,
      status: isDraft ? "DRAFT" : status,
      shippingCost, // Already converted to cents by ProductSchema
      handlingFee, // Already converted to cents by ProductSchema
      itemWeight,
      itemWeightUnit: "lbs",
      itemLength,
      itemWidth,
      itemHeight,
      itemDimensionUnit: "in",
      shippingNotes,
      freeShipping,
      isDigital: isDigital || false,
      stock: stock || 1,
      images,
      productFile,
      numberSold,
      onSale,
      discount,
      primaryCategory,
      secondaryCategory,
      tertiaryCategory,
      tags,
      materialTags,
      options,
      inStockProcessingTime,
      outStockLeadTime,
      howItsMade,
      productDrop,
      NSFW,
      dropDate: dropDate ? new Date(dropDate) : null,
      dropTime,
      discountEndDate: discountEndDate && discountEndDate !== null ? new Date(discountEndDate) : undefined,
      discountEndTime: data.discountEndTime,
      metaTitle,
      metaDescription,
      keywords,
      ogTitle,
      ogDescription,
      ogImage,
      isTestProduct,
      // GPSR Compliance fields
      safetyWarnings,
      materialsComposition,
      safeUseInstructions,
      ageRestriction,
      chokingHazard,
      smallPartsWarning,
      chemicalWarnings,
      careInstructions,
    };

    // --- Step 3: Validate data based on whether it's a draft or active product ---
    let validationResult;
    if (isDraft) {
      validationResult = ProductDraftSchema.safeParse(productData);
    } else {
      validationResult = ProductSchema.safeParse(productData);
    }

    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Validation failed",
          details: validationResult.error.errors,
        }),
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // --- Step 4: Create the product ---
    const product = await db.product.create({
      data: {
        ...validatedData,
        userId: session.user.id, // Add userId back since it's not in the schema
        description: validatedData.description || { html: "", text: "" }, // Ensure description is never undefined
        stock: validatedData.stock ?? undefined, // Convert null to undefined for Prisma
      },
    });

    console.log("[PRODUCT CREATED] Product ID:", product.id);

    // --- Step 5: Generate batch number for physical products ---
    if (!validatedData.isDigital) {
      try {
        const batchNumber = await generateBatchNumber(product.id);
        await db.product.update({
          where: { id: product.id },
          data: { batchNumber }
        });
        console.log("[BATCH NUMBER] Generated:", batchNumber);
      } catch (error) {
        console.error("[BATCH NUMBER] Error generating batch number:", error);
        // Don't fail the entire request if batch number generation fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        productId: product.id,
        message: isDraft 
          ? "Product draft saved successfully! Complete the required fields to make it active." 
          : "Product created successfully!",
        isDraft,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to create product",
      }),
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ProductSchema, ProductDraftSchema } from "@/schemas/ProductSchema";
import { generateUniqueSKU } from "@/lib/sku-generator";
import { getSellerOnboardingSteps } from "@/lib/onboarding";
import { generateBatchNumber } from "@/lib/batchNumber";
import { SUPPORTED_CURRENCIES } from "@/data/units";
import { logError } from "@/lib/error-logger";
import { logQaEvent } from "@/lib/qa-logger";
import { QA_EVENTS, PRODUCT_STEPS } from "@/lib/qa-steps";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = "force-dynamic";

// 60 seconds timeout

// For body size limit, we need to use a different approach in App Router
// This will be handled in the POST function

export async function POST(req: NextRequest) {
  //console.log("API HIT: /api/products/create-product");

  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let seller: {
    id: string;
    userId: string;
    isFullyActivated: boolean;
    applicationAccepted: boolean;
  } | null = null;
  let data: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      // Expected security check - no DB logging needed
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized",
        }),
        { status: 401 }
      );
    }

    // Get QA session ID from header
    const qaSessionId = req.headers.get("x-qa-session-id") || "";

    data = await req.json();

    // Enhanced logging with currency context
    const currencyInfo = data.currency
      ? SUPPORTED_CURRENCIES.find((c) => c.code === data.currency)
      : null;

    console.log("[API INPUT] Received product data:", {
      name: data.name,
      status: data.status,
      isDigital: data.isDigital,
      currency: data.currency,
      currencyInfo: currencyInfo
        ? {
            name: currencyInfo.name,
            symbol: currencyInfo.symbol,
            decimals: currencyInfo.decimals,
          }
        : "Currency not found or missing",
      monetaryValues: {
        price: data.price,
        shippingCost: data.shippingCost,
        handlingFee: data.handlingFee,
        // Note: These values should already be in smallest unit (cents) from schema transform
      },
      imagesCount: data.images?.length || 0,
      hasProductFile: !!data.productFile,
      primaryCategory: data.primaryCategory,
      secondaryCategory: data.secondaryCategory,
    });

    const {
      name,
      sku,
      shortDescription,
      shortDescriptionBullets = [],
      price: rawPrice,
      description,
      status,
      shippingCost: rawShippingCost = 0,
      handlingFee: rawHandlingFee = 0,
      itemWeight,
      itemWeightUnit, // CRITICAL: Extract from form data for international sellers
      itemLength,
      itemWidth,
      itemHeight,
      itemDimensionUnit, // CRITICAL: Extract from form data for international sellers
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
      currency = "USD",
      isTestProduct = false,
      // SEO fields
      metaTitle,
      metaDescription,
      keywords = [],
      ogTitle,
      ogDescription,
      ogImage,
      // GPSR Compliance fields - these will be converted to null if empty in productData
      safetyWarnings,
      materialsComposition,
      safeUseInstructions,
      ageRestriction,
      chokingHazard,
      smallPartsWarning,
      chemicalWarnings,
      careInstructions,
      // Tax fields
      taxCategory = "PHYSICAL_GOODS",
      taxCode,
      taxExempt = false,
    } = data;

    // Check if seller exists and get onboarding status
    seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        userId: true,
        isFullyActivated: true,
        applicationAccepted: true,
      },
    });

    if (!seller) {
      // Expected - user may not have seller profile yet - no DB logging needed
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

      // Check onboarding completion
      if (!seller.isFullyActivated) {
        // Expected business logic - no DB logging needed
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "You must complete your seller onboarding before creating active products. Please complete all onboarding steps first.",
            onboardingIncomplete: true,
            onboardingStatus: {
              isFullyActivated: seller.isFullyActivated,
              steps: onboardingSteps,
            },
          }),
          { status: 403 }
        );
      }
    }

    // Basic validation for required fields
    // For drafts, only name is required. For non-drafts, name, price, and primaryCategory are required
    if (isDraft) {
      // Only name is required for drafts
      if (!name || name.trim() === "") {
        // Expected validation - no DB logging needed
        console.warn("Missing required field for draft:", { name });
        return new Response(
          JSON.stringify({
            success: false,
            error: "Product name is required",
          }),
          { status: 400 }
        );
      }
    } else {
      // For non-draft products, require name, price, and primaryCategory
      if (!name || !rawPrice || !primaryCategory) {
        // Expected validation - no DB logging needed
        console.warn("Missing required fields:", {
          name,
          price: rawPrice,
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
    }

    //console.log("Creating product with sanitized data...");

    // --- Step 1: Generate SKU if not provided ---
    let finalSku = sku;
    if (!sku || sku.trim() === "") {
      try {
        finalSku = await generateUniqueSKU(name, seller.userId);
        console.log("[SKU GENERATION] Generated SKU:", finalSku);
      } catch (error) {
        // Log SKU generation failure
        console.error("[SKU GENERATION] Error generating SKU:", error);
        logError({
          code: "PRODUCT_CREATE_SKU_GENERATION_FAILED",
          userId: session.user.id,
          route: "/api/products/create-product",
          method: "POST",
          error,
          metadata: {
            productName: name,
            sellerId: seller.id,
            note: "Failed to generate unique SKU for product",
          },
        });
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
      name: name.trim(),
      sku: finalSku,
      // CRITICAL: Prisma requires shortDescription to be non-null
      // If it's empty or null, use empty string instead of null
      shortDescription:
        shortDescription && shortDescription.trim() !== ""
          ? shortDescription.trim()
          : "",
      shortDescriptionBullets: shortDescriptionBullets || [],
      description: description || { html: "", text: "" },
      // CRITICAL: Ensure monetary values are integers (Prisma Int type requires whole numbers)
      // Values are already in smallest unit (cents) from schema transform, but ensure they're integers
      // Use Math.floor to ensure we get integers (Math.round could still produce floats in edge cases)
      price: Math.floor(Number(rawPrice) || 0), // Price is already converted to cents by ProductSchema
      currency,
      status: isDraft ? "DRAFT" : status,
      shippingCost:
        rawShippingCost !== null && rawShippingCost !== undefined
          ? Math.floor(Number(rawShippingCost) || 0)
          : null, // Already converted to cents by ProductSchema
      handlingFee:
        rawHandlingFee !== null && rawHandlingFee !== undefined
          ? Math.floor(Number(rawHandlingFee) || 0)
          : null, // Already converted to cents by ProductSchema
      // CRITICAL: Dimensions and weight are OPTIONAL for all products
      // Use ?? to convert undefined/null to null (database-friendly)
      // Note: 0 values are invalid and will be caught by schema validation (must be > 0 if provided)
      itemWeight: itemWeight ?? null,
      // CRITICAL: Use form values for weight/dimension units, not hardcoded values
      // This is essential for international sellers who use metric units (kg, cm, m)
      // The form should send these values from seller preferences or product data
      itemWeightUnit: data.itemWeightUnit || "lbs", // Fallback to lbs if not provided (for backward compatibility)
      itemLength: itemLength ?? null,
      itemWidth: itemWidth ?? null,
      itemHeight: itemHeight ?? null,
      itemDimensionUnit: data.itemDimensionUnit || "in", // Fallback to in if not provided (for backward compatibility)
      shippingNotes:
        shippingNotes && shippingNotes.trim() !== ""
          ? shippingNotes.trim()
          : null,
      freeShipping,
      isDigital: isDigital || false,
      // CRITICAL: Stock handling
      // For non-draft physical products: stock is required and must be >= 1 (validated in schema)
      // For drafts: stock is optional and can be undefined or 0
      // Schema validation will catch invalid stock values (e.g., 0 for active products)
      // Use ?? to only convert undefined/null, preserving 0 if provided (validation will catch it if invalid)
      stock: stock ?? (isDraft ? undefined : 1),
      images,
      productFile,
      numberSold: numberSold ?? 0, // Use ?? to preserve 0 values
      onSale,
      discount: discount ?? null, // Optional field - use null instead of undefined
      // For drafts, allow empty categories (use empty string, not null, since Prisma requires non-null)
      // For non-drafts, these are required and validated earlier
      primaryCategory: isDraft ? primaryCategory || "" : primaryCategory,
      secondaryCategory: isDraft ? secondaryCategory || "" : secondaryCategory,
      tertiaryCategory:
        tertiaryCategory && tertiaryCategory.trim() !== ""
          ? tertiaryCategory.trim()
          : null, // This one is nullable in schema
      tags,
      materialTags,
      options,
      // CRITICAL: Use ?? instead of || to preserve 0 values (0 is a valid value for processing times)
      // Only convert undefined/null to null, not falsy values like 0
      inStockProcessingTime: inStockProcessingTime ?? null,
      outStockLeadTime: outStockLeadTime ?? null,
      howItsMade:
        howItsMade && howItsMade.trim() !== "" ? howItsMade.trim() : null,
      productDrop,
      NSFW,
      dropDate: dropDate ? new Date(dropDate) : null,
      dropTime: dropTime && dropTime.trim() !== "" ? dropTime.trim() : null, // Optional field - convert empty string to null
      // SEO fields - convert empty strings to null for optional fields
      metaTitle: metaTitle && metaTitle.trim() !== "" ? metaTitle.trim() : null,
      metaDescription:
        metaDescription && metaDescription.trim() !== ""
          ? metaDescription.trim()
          : null,
      keywords,
      ogTitle: ogTitle && ogTitle.trim() !== "" ? ogTitle.trim() : null,
      ogDescription:
        ogDescription && ogDescription.trim() !== ""
          ? ogDescription.trim()
          : null,
      ogImage: ogImage && ogImage.trim() !== "" ? ogImage.trim() : null,
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
      // Tax fields - convert empty string to null for taxCode
      taxCategory: taxCategory || "PHYSICAL_GOODS",
      taxCode: taxCode && taxCode.trim() !== "" ? taxCode : null,
      taxExempt: taxExempt || false,
    };

    // --- Step 3: Validate data structure (but don't transform, since form already transformed) ---
    // The form has already validated and transformed the data (price to cents, etc.)
    // So we just need to ensure the data structure is valid, but use the data as-is
    // Note: Price, shippingCost, and handlingFee are already in cents from the form validation

    // --- Step 4: Create the product ---
    // CRITICAL: Remove undefined values from productData (Prisma doesn't accept undefined, only null)
    // Convert all undefined to null for optional fields
    const cleanedProductData: any = {};
    for (const [key, value] of Object.entries(productData)) {
      cleanedProductData[key] = value === undefined ? null : value;
    }

    const product = await db.product.create({
      data: {
        ...cleanedProductData,
        // userId is the foreign key that references Seller.userId
        // Note: If you get "Unknown argument userId" error, run: npx prisma generate
        userId: session.user.id,
        description: productData.description || { html: "", text: "" }, // Ensure description is never undefined
        // CRITICAL: Prisma requires shortDescription to be non-null String
        // Use empty string if not provided (already set in productData, but ensure it's not null)
        shortDescription: productData.shortDescription || "",
        stock: productData.stock ?? undefined, // Convert null to undefined for Prisma
      },
    });

    console.log("[PRODUCT CREATED] Product ID:", product.id);

    // --- Step 5: Generate batch number for physical products ---
    if (!productData.isDigital) {
      try {
        const batchNumber = await generateBatchNumber(product.id);
        await db.product.update({
          where: { id: product.id },
          data: { batchNumber },
        });
        console.log("[BATCH NUMBER] Generated:", batchNumber);
      } catch (error) {
        // Log batch number generation failure (non-critical, but should be tracked)
        console.error("[BATCH NUMBER] Error generating batch number:", error);
        logError({
          code: "PRODUCT_CREATE_BATCH_NUMBER_FAILED",
          userId: session.user.id,
          route: "/api/products/create-product",
          method: "POST",
          error,
          metadata: {
            productId: product.id,
            isDigital: productData.isDigital,
            note: "Failed to generate batch number for physical product (non-critical)",
          },
        });
        // Don't fail the entire request if batch number generation fails
      }
    }

    // QA logging: Log successful product creation
    logQaEvent({
      userId: session.user.id,
      sessionId: qaSessionId,
      event: QA_EVENTS.PRODUCT_CREATE,
      step: PRODUCT_STEPS.SUBMIT,
      status: "completed",
      route: "/api/products/create-product",
      metadata: {
        productId: product.id,
        isDraft,
        isDigital: data.isDigital,
        imageCount: data.images?.length || 0,
        hasProductFile: !!data.productFile,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        product: product, // Include full product object for client
        productId: product.id,
        message: isDraft
          ? "Product draft saved successfully! Complete the required fields to make it active."
          : "Product created successfully!",
        isDraft,
      }),
      { status: 201 }
    );
  } catch (error) {
    // QA logging: Log product creation failure
    const qaSessionId = req.headers.get("x-qa-session-id") || "";
    if (session?.user?.id) {
      logQaEvent({
        userId: session.user.id,
        sessionId: qaSessionId,
        event: QA_EVENTS.PRODUCT_CREATE,
        step: PRODUCT_STEPS.SUBMIT,
        status: "failed",
        route: "/api/products/create-product",
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          isDraft: data?.status === "DRAFT",
          isDigital: data?.isDigital,
        },
      });
    }

    // Enhanced error logging with currency context
    const currencyInfo = data?.currency
      ? SUPPORTED_CURRENCIES.find((c) => c.code === data.currency)
      : null;

    // Prepare metadata for error logging
    const errorMetadata = {
      userId: session?.user?.id || "unknown",
      sellerId: seller?.id || "unknown",
      currency: data?.currency || "unknown",
      currencyInfo: currencyInfo
        ? {
            name: currencyInfo.name,
            symbol: currencyInfo.symbol,
            decimals: currencyInfo.decimals,
          }
        : "Currency not found or missing",
      productData: {
        name: data?.name,
        status: data?.status,
        isDigital: data?.isDigital,
        price: data?.price,
        shippingCost: data?.shippingCost,
        handlingFee: data?.handlingFee,
        currency: data?.currency,
        primaryCategory: data?.primaryCategory,
        secondaryCategory: data?.secondaryCategory,
        imagesCount: data?.images?.length || 0,
        hasProductFile: !!data?.productFile,
      },
      // Check if error is related to currency conversion
      isCurrencyError:
        error instanceof Error &&
        (error.message.includes("currency") ||
          error.message.includes("Currency") ||
          error.message.includes("decimal") ||
          error.message.includes("conversion")),
    };

    // Log to console (existing behavior)
    console.error("[API ERROR] Product creation failed:", {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
      ...errorMetadata,
      timestamp: new Date().toISOString(),
    });

    // Check if it's a ZodError (validation error)
    if (error && typeof error === "object" && "issues" in error) {
      const zodError = error as {
        issues: Array<{ message: string; path: (string | number)[] }>;
      };

      // Check for currency-related validation errors
      const currencyErrors = zodError.issues.filter(
        (issue) =>
          issue.path.includes("currency") ||
          issue.path.includes("price") ||
          issue.message.toLowerCase().includes("currency") ||
          issue.message.toLowerCase().includes("decimal")
      );

      if (currencyErrors.length > 0 && currencyInfo) {
        console.error("[API ERROR] Currency validation errors detected:", {
          currencyErrors,
          currency: data?.currency,
          currencyInfo,
        });
      }

      // Log validation errors to database
      logError({
        code: "PRODUCT_VALIDATION_FAILED",
        userId: session?.user?.id,
        route: "/api/products/create-product",
        method: "POST",
        error,
        metadata: {
          ...errorMetadata,
          validationErrors: zodError.issues,
          currencyErrors:
            currencyErrors.length > 0 ? currencyErrors : undefined,
        },
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: "Validation failed",
          details: zodError.issues,
          // Add helpful context for currency errors
          currencyContext:
            currencyErrors.length > 0 && currencyInfo
              ? {
                  currency: data?.currency,
                  currencyName: currencyInfo.name,
                  currencySymbol: currencyInfo.symbol,
                  currencyDecimals: currencyInfo.decimals,
                  hint:
                    currencyInfo.decimals === 0
                      ? "This currency only accepts whole numbers (no decimals)"
                      : `This currency accepts up to ${currencyInfo.decimals} decimal places`,
                }
              : undefined,
        }),
        { status: 400 }
      );
    }

    // Log to database for non-validation errors
    const userMessage = logError({
      code: "PRODUCT_CREATE_FAILED",
      userId: session?.user?.id,
      route: "/api/products/create-product",
      method: "POST",
      error,
      metadata: errorMetadata,
    });

    // Provide more helpful error messages for currency-related issues
    let userFriendlyError = userMessage;
    if (
      error instanceof Error &&
      (error.message.includes("currency") ||
        error.message.includes("Currency") ||
        error.message.includes("decimal") ||
        error.message.includes("conversion")) &&
      currencyInfo
    ) {
      userFriendlyError = `Currency error: ${error.message}. Please check that your prices are valid for ${currencyInfo.name} (${currencyInfo.code}). ${currencyInfo.decimals === 0 ? "This currency only accepts whole numbers." : `This currency accepts up to ${currencyInfo.decimals} decimal places.`}`;
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: userFriendlyError,
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

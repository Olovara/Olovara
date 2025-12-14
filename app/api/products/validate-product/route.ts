import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { ProductSchema, ProductDraftSchema } from "@/schemas/ProductSchema";
import { SUPPORTED_CURRENCIES } from "@/data/units";
import * as z from "zod";
import { logError } from "@/lib/error-logger";

/**
 * Validate product data BEFORE uploading images/files
 * This prevents orphaned images if validation fails
 *
 * NOTE: Images and productFile are NOT validated here since they haven't been uploaded yet
 * They will be validated when the actual product is created
 */
export async function POST(req: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let data: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized",
        }),
        { status: 401 }
      );
    }

    data = await req.json();

    // Determine if this is a draft
    const isDraft = data.status === "DRAFT";

    // CRITICAL: For validation, we need to skip image/file validation
    // since they haven't been uploaded yet. We'll validate images when the product is actually created.
    //
    // NOTE: ProductSchema and ProductDraftSchema are ZodEffects (have transforms/superRefine),
    // so we can't use .extend(). Instead, we'll:
    // 1. For drafts: Use ProductDraftSchema which already allows empty images
    // 2. For active: Temporarily set status to DRAFT to use ProductDraftSchema, then validate everything else
    //    OR manually validate required fields excluding images

    let validationResult;

    if (isDraft) {
      // Drafts already allow empty images, so we can validate directly
      // But we need to provide empty images array
      validationResult = ProductDraftSchema.safeParse({
        ...data,
        images: [], // Empty for validation - will be validated when product is created
        productFile: null, // Null for validation - will be validated when product is created
      });
    } else {
      // For active products, temporarily validate as draft to skip image requirement
      // Then manually check that images will be provided (we'll validate this when product is created)
      // This validates all other fields without requiring images
      validationResult = ProductDraftSchema.safeParse({
        ...data,
        status: "DRAFT", // Temporarily set to draft to skip image requirement
        images: [], // Empty for validation
        productFile: null, // Null for validation
      });

      // If draft validation passes, check additional requirements for active products
      if (validationResult.success) {
        const activeProductErrors: Array<{
          path: (string | number)[];
          message: string;
        }> = [];

        // Check required fields for active products (excluding images - those will be validated after upload)
        if (!data.primaryCategory) {
          activeProductErrors.push({
            path: ["primaryCategory"],
            message: "Primary category is required for active products",
          });
        }

        if (!data.secondaryCategory) {
          activeProductErrors.push({
            path: ["secondaryCategory"],
            message: "Secondary category is required for active products",
          });
        }

        if (
          !data.description ||
          !data.description.html ||
          data.description.html.trim() === ""
        ) {
          activeProductErrors.push({
            path: ["description"],
            message: "Product description is required for active products",
          });
        }

        if (!data.isDigital && (!data.stock || data.stock < 1)) {
          activeProductErrors.push({
            path: ["stock"],
            message:
              "Stock quantity is required and must be at least 1 for physical products",
          });
        }

        if (activeProductErrors.length > 0) {
          // Return validation error with active product requirements
          return new Response(
            JSON.stringify({
              success: false,
              error: "Validation failed",
              details: activeProductErrors,
            }),
            { status: 400 }
          );
        }
      }
    }

    if (!validationResult.success) {
      // Handle Zod validation errors
      const zodError = validationResult.error;
      console.error("[VALIDATE PRODUCT ERROR] Validation failed:", {
        errors: zodError.issues,
        isDraft,
        timestamp: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: "Validation failed",
          details: zodError.issues,
          // Add helpful context for currency errors
          currencyContext: data.currency
            ? (() => {
                const currencyInfo = SUPPORTED_CURRENCIES.find(
                  (c) => c.code === data.currency
                );
                return currencyInfo
                  ? {
                      currency: data.currency,
                      currencyName: currencyInfo.name,
                      currencySymbol: currencyInfo.symbol,
                      currencyDecimals: currencyInfo.decimals,
                      hint:
                        currencyInfo.decimals === 0
                          ? "This currency only accepts whole numbers (no decimals)"
                          : `This currency accepts up to ${currencyInfo.decimals} decimal places`,
                    }
                  : undefined;
              })()
            : undefined,
        }),
        { status: 400 }
      );
    }

    // Validation passed
    return new Response(
      JSON.stringify({
        success: true,
        message: "Validation passed",
      }),
      { status: 200 }
    );
  } catch (error) {
    // Log to console (always happens)
    console.error("[VALIDATE PRODUCT ERROR] Unexpected error:", {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
      timestamp: new Date().toISOString(),
    });

    // Don't log Zod validation errors - they're expected client-side issues
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Validation failed",
          details: error.errors,
        }),
        { status: 400 }
      );
    }

    // Log to database - user could email about "product validation not working"
    const userMessage = logError({
      code: "PRODUCT_VALIDATION_FAILED",
      userId: session?.user?.id,
      route: "/api/products/validate-product",
      method: "POST",
      error,
      metadata: {
        productName: data?.name,
        status: data?.status,
        note: "Failed to validate product",
      },
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: userMessage,
      }),
      { status: 500 }
    );
  }
}

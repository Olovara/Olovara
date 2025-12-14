import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ProductSchema } from "@/schemas/ProductSchema";
import { getSellerOnboardingSteps } from "@/lib/onboarding";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let data: any = null;
  let productId: string | undefined = undefined;
  let newStatus: string | undefined = undefined;
  let product: any = null;

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
    const { productId: pid, newStatus: ns } = data;
    productId = pid;
    newStatus = ns;

    if (!productId || !newStatus) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Product ID and new status are required",
        }),
        { status: 400 }
      );
    }

    // Check if seller exists and get onboarding status
    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        userId: true,
        isFullyActivated: true,
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

    // Get the product and verify ownership
    product = await db.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        userId: true,
        status: true,
        name: true,
        description: true,
        price: true,
        currency: true,
        images: true,
        stock: true,
        isDigital: true,
        productFile: true,
        primaryCategory: true,
        secondaryCategory: true,
        shippingCost: true,
        handlingFee: true,
        itemWeight: true,
        itemLength: true,
        itemWidth: true,
        itemHeight: true,
        shippingNotes: true,
        freeShipping: true,
        onSale: true,
        discount: true,
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
        metaTitle: true,
        metaDescription: true,
        keywords: true,
        ogTitle: true,
        ogDescription: true,
        ogImage: true,
        isTestProduct: true,
        taxCategory: true,
        taxCode: true,
        taxExempt: true,
        shippingOptionId: true,
      },
    });

    if (!product) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Product not found",
        }),
        { status: 404 }
      );
    }

    if (product.userId !== session.user.id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "You don't have permission to update this product",
        }),
        { status: 403 }
      );
    }

    // If trying to set status to ACTIVE, check onboarding completion
    if (newStatus === "ACTIVE") {
      if (!seller.isFullyActivated) {
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "You must complete your seller onboarding before activating products. Please complete all onboarding steps first.",
            onboardingIncomplete: true,
            onboardingStatus: {
              isFullyActivated: seller.isFullyActivated,
              steps: onboardingSteps,
            },
          }),
          { status: 403 }
        );
      }

      // Validate the product meets all requirements for active status
      const validationResult = ProductSchema.safeParse({
        ...product,
        price: product.price / 100, // Convert back to dollars for validation
        shippingCost: product.shippingCost ? product.shippingCost / 100 : 0,
        handlingFee: product.handlingFee ? product.handlingFee / 100 : 0,
      });

      if (!validationResult.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Product does not meet requirements for active status",
            details: validationResult.error.errors,
            missingFields: validationResult.error.errors.map((err) =>
              err.path.join(".")
            ),
          }),
          { status: 400 }
        );
      }
    }

    // Update the product status
    const updatedProduct = await db.product.update({
      where: { id: productId },
      data: { status: newStatus },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message:
          newStatus === "ACTIVE"
            ? "Product activated successfully!"
            : `Product status updated to ${newStatus}`,
        product: updatedProduct,
      }),
      { status: 200 }
    );
  } catch (error) {
    // Log to console (always happens)
    console.error("[API ERROR] Product status update failed:", {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
      productId: productId,
      newStatus: newStatus || data?.newStatus,
      userId: session?.user?.id || "unknown",
      productStatus: product?.status,
      timestamp: new Date().toISOString(),
    });

    // Don't log validation errors - they're expected client-side issues

    // Log to database - user could email about "couldn't update product status"
    const userMessage = logError({
      code: "PRODUCT_STATUS_UPDATE_FAILED",
      userId: session?.user?.id,
      route: "/api/products/update-status",
      method: "PUT",
      error,
      metadata: {
        productId,
        newStatus: newStatus || data?.newStatus,
        currentStatus: product?.status,
        note: "Failed to update product status",
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

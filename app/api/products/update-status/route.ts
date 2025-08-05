import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ProductSchema } from "@/schemas/ProductSchema";

export async function PUT(req: NextRequest) {
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
    const { productId, newStatus } = data;

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
        applicationAccepted: true,
        stripeConnected: true,
        shopProfileComplete: true,
        shippingProfileCreated: true,
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

    // Get the product and verify ownership
    const product = await db.product.findUnique({
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
        discountEndDate: true,
        discountEndTime: true,
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
        shippingProfileId: true,
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
            error: "You must complete your seller onboarding before activating products. Please complete all onboarding steps first.",
            onboardingIncomplete: true,
            onboardingStatus: {
              applicationAccepted: seller.applicationAccepted,
              stripeConnected: seller.stripeConnected,
              shopProfileComplete: seller.shopProfileComplete,
              shippingProfileCreated: seller.shippingProfileCreated,
              isFullyActivated: seller.isFullyActivated,
            }
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
            missingFields: validationResult.error.errors.map(err => err.path.join('.')),
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
        message: newStatus === "ACTIVE" 
          ? "Product activated successfully!" 
          : `Product status updated to ${newStatus}`,
        product: updatedProduct,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating product status:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to update product status",
      }),
      { status: 500 }
    );
  }
} 
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = params.productId;

    if (!productId) {
      // Expected validation - no DB logging needed
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Fetch product with seller information
    const product = await db.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        images: true,
        price: true,
        currency: true,
        isDigital: true,
        shippingCost: true,
        handlingFee: true,
        stock: true,
        onSale: true,
        discount: true,
        saleStartDate: true,
        saleEndDate: true,
        saleStartTime: true,
        saleEndTime: true,
        seller: {
          select: {
            id: true,
            userId: true,
            shopName: true,
            shopNameSlug: true,
          },
        },
      },
    });

    if (!product) {
      // Expected - product may not exist - no DB logging needed
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!product.seller) {
      // This could be a data integrity issue - log to DB
      logError({
        code: "CHECKOUT_PRODUCT_SELLER_NOT_FOUND",
        route: `/api/products/${productId}/checkout`,
        method: "GET",
        metadata: {
          productId,
          note: "Product exists but seller is missing - data integrity issue",
        },
      });
      return NextResponse.json(
        { error: "Product seller not found" },
        { status: 404 }
      );
    }

    // Check if product is active
    if (product.stock <= 0 && !product.isDigital) {
      // Expected business logic - no DB logging needed
      return NextResponse.json(
        { error: "Product is out of stock" },
        { status: 400 }
      );
    }

    // Calculate if sale is currently active
    const now = new Date();
    let isSaleActive = product.onSale && product.discount;

    if (isSaleActive && product.saleStartDate) {
      const saleStart = new Date(product.saleStartDate);
      if (product.saleStartTime) {
        const [hours, minutes] = product.saleStartTime.split(":").map(Number);
        saleStart.setHours(hours, minutes, 0, 0);
      }
      if (now < saleStart) {
        isSaleActive = false;
      }
    }

    if (isSaleActive && product.saleEndDate) {
      const saleEnd = new Date(product.saleEndDate);
      if (product.saleEndTime) {
        const [hours, minutes] = product.saleEndTime.split(":").map(Number);
        saleEnd.setHours(hours, minutes, 0, 0);
      }
      if (now > saleEnd) {
        isSaleActive = false;
      }
    }

    return NextResponse.json({
      id: product.id,
      name: product.name,
      image: product.images[0] || "/placeholder.png", // Use first image or placeholder
      price: product.price,
      currency: product.currency,
      seller: {
        id: product.seller.id,
        userId: product.seller.userId,
        shopName: product.seller.shopName,
        shopNameSlug: product.seller.shopNameSlug,
      },
      isDigital: product.isDigital,
      shippingCost: product.shippingCost || 0,
      handlingFee: product.handlingFee || 0,
      stock: product.stock,
      onSale: isSaleActive,
      discount: isSaleActive ? product.discount : null,
    });
  } catch (error) {
    // Log to console (existing behavior)
    console.error("Error fetching product for checkout:", error);

    // Log to error database
    const userMessage = logError({
      code: "CHECKOUT_PRODUCT_FETCH_FAILED",
      route: `/api/products/${params?.productId}/checkout`,
      method: "GET",
      error,
      metadata: {
        productId: params?.productId,
        note: "Failed to fetch product data for checkout page",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = params.productId;

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
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
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!product.seller) {
      return NextResponse.json({ error: "Product seller not found" }, { status: 404 });
    }

    // Check if product is active
    if (product.stock <= 0 && !product.isDigital) {
      return NextResponse.json({ error: "Product is out of stock" }, { status: 400 });
    }

    // Calculate if sale is currently active
    const now = new Date();
    let isSaleActive = product.onSale && product.discount;
    
    if (isSaleActive && product.saleStartDate) {
      const saleStart = new Date(product.saleStartDate);
      if (product.saleStartTime) {
        const [hours, minutes] = product.saleStartTime.split(':').map(Number);
        saleStart.setHours(hours, minutes, 0, 0);
      }
      if (now < saleStart) {
        isSaleActive = false;
      }
    }

    if (isSaleActive && product.saleEndDate) {
      const saleEnd = new Date(product.saleEndDate);
      if (product.saleEndTime) {
        const [hours, minutes] = product.saleEndTime.split(':').map(Number);
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
    console.error("Error fetching product for checkout:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// GET - Fetch products for a seller
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId");

    if (!sellerId) {
      return NextResponse.json({ error: "Seller ID is required" }, { status: 400 });
    }

    // Verify the user is the seller or an admin
    const seller = await db.seller.findUnique({
      where: { userId: sellerId },
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Check if user is the seller or has admin permissions
    if (session.user.id !== sellerId) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { admin: true },
      });

      if (!user?.admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const products = await db.product.findMany({
      where: { userId: sellerId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        price: true,
        onSale: true,
        discount: true,
        saleStartDate: true,
        saleEndDate: true,
        saleStartTime: true,
        saleEndTime: true,
        status: true,
        images: true,
        stock: true,
        numberSold: true,
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

// GET - Fetch products for a seller
export async function GET(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId");

    if (!sellerId) {
      return NextResponse.json(
        { error: "Seller ID is required" },
        { status: 400 }
      );
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
    // Log to console (always happens)
    console.error("Error fetching products:", error);

    // Log to database - user could email about "can't see my products"
    const userMessage = logError({
      code: "SELLER_PRODUCTS_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/products",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch seller products",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

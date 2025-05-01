import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// Function to fetch total sales and revenue for a seller
const fetchSellerData = async (
  userId: string,
  startDate?: string,
  endDate?: string
) => {
  const parsedStartDate = startDate ? new Date(startDate) : undefined;
  const parsedEndDate = endDate ? new Date(endDate) : undefined;

  const seller = await db.seller.findUnique({
    where: { userId },
    include: {
      products: true,
    },
  });

  if (!seller) {
    throw new Error("Seller not found");
  }

  let createdAtFilter = undefined;

  if (parsedStartDate && parsedEndDate) {
    createdAtFilter = {
      gte: parsedStartDate,
      lte: parsedEndDate,
    };
  } else if (parsedStartDate) {
    createdAtFilter = {
      gte: parsedStartDate,
    };
  } else if (parsedEndDate) {
    createdAtFilter = {
      lte: parsedEndDate,
    };
  }

  const orders = await db.order.findMany({
    where: {
      sellerId: seller.id,
      ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
    },
    select: {
      id: true,
      productId: true,
      productName: true,
      quantity: true,
      totalAmount: true,
    },
  });

  // Calculate most popular product
  const productSales = new Map<string, { name: string, count: number }>();
  
  orders.forEach(order => {
    const productId = order.productId;
    const current = productSales.get(productId) || { name: order.productName, count: 0 };
    productSales.set(productId, {
      name: current.name,
      count: current.count + order.quantity
    });
  });

  const mostPopularProduct = Array.from(productSales.entries())
    .sort((a, b) => b[1].count - a[1].count)[0]?.[1].name || "No products sold yet";

  let totalRevenue = orders.reduce((acc, order) => acc + (order.totalAmount ?? 0), 0);
  
  // Calculate average order value
  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  // Get product status counts
  const activeProducts = seller.products.filter(p => p.status === "ACTIVE").length;
  const hiddenProducts = seller.products.filter(p => p.status === "HIDDEN").length;
  const disabledProducts = seller.products.filter(p => p.status === "DISABLED").length;
  const soldOutProducts = seller.products.filter(p => p.stock === 0).length;
  const totalProducts = seller.products.length;

  return {
    totalOrders: orders.length,
    totalSales: totalRevenue,
    totalProducts,
    activeProducts,
    hiddenProducts,
    disabledProducts,
    soldOutProducts,
    mostPopularProduct,
    averageOrderValue,
  };
};

// This handles the GET request for the seller dashboard data
export async function GET(req: Request) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json(
      { error: "You must be logged in" },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  const url = new URL(req.url);
  const startDate = url.searchParams.get("startDate") ?? undefined;
  const endDate = url.searchParams.get("endDate") ?? undefined;

  try {
    const sellerData = await fetchSellerData(userId, startDate, endDate);

    return NextResponse.json(sellerData);
  } catch (error) {
    console.error("Error in /api/seller/dashboard:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
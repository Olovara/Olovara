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
  });

  //console.log("Found Seller:", !!seller);
  //console.log("Total Orders Returned:", orders?.length);
  //console.log("Orders:", orders);

  const totalSales = seller.totalSales ?? 0;
  const totalProducts = seller.products.length;
  const mostPopularProduct =
    seller.products.length > 0 ? seller.products[0].name : "No products";

    let totalRevenue = orders.reduce((acc, order) => acc + (order.totalAmount ?? 0), 0);

  return {
    totalRevenue,
    totalSales,
    totalProducts,
    mostPopularProduct,
  };
};

// This handles the GET request for the seller dashboard data
export async function GET(req: Request) {
  const session = await auth(); // Get the session (this assumes you're using NextAuth.js for authentication)

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json(
      { error: "You must be logged in" },
      { status: 401 }
    );
  }

  const userId = session.user.id; // Get the logged-in user's ID (assuming it's stored in the session)

  const url = new URL(req.url); // Parse URL
  const startDate = url.searchParams.get("startDate") ?? undefined;
  const endDate = url.searchParams.get("endDate") ?? undefined;

  try {
    const sellerData = await fetchSellerData(userId, startDate, endDate);

    return NextResponse.json(sellerData);
  } catch (error) {
    console.error("Error in /api/seller/dashboard:", error); // 👈 log full error
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

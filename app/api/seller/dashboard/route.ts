import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// Function to fetch total sales and revenue for a seller
const fetchSellerData = async (
  userId: string,
  startDate?: string,
  endDate?: string
) => {
  // Parse dates properly to avoid timezone mismatch
  const parsedStartDate = startDate ? new Date(startDate) : undefined;
  const parsedEndDate = endDate ? new Date(endDate) : undefined;

  const seller = await db.seller.findUnique({
    where: {
      userId, // Find the seller based on the userId
    },
    include: {
      order: {
        where: {
          createdAt: {
            gte: parsedStartDate || undefined, // If no start date, use undefined to not apply filtering
            lte: parsedEndDate || undefined, // Same for end date
          },
        },
      },
      products: true,
    },
  });

  if (!seller) {
    throw new Error("Seller not found");
  }

  const totalSales = seller.totalSales;
  const totalProducts = seller.products.length;
  const mostPopularProduct =
    seller.products.length > 0 ? seller.products[0].name : "No products";

  let totalRevenue = 0;
  if (seller.order && seller.order.length > 0) {
    totalRevenue = seller.order.reduce(
      (acc, order) => acc + order.totalAmount,
      0
    );
  }

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
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  try {
    const sellerData = await fetchSellerData(userId, startDate, endDate);

    return NextResponse.json(sellerData);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Error fetching seller data" },
      { status: 500 }
    );
  }
}

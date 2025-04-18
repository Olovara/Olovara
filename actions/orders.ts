import { db } from "@/lib/db";

export async function getSellerOrders(userId: string) {
  if (!userId) {
    throw new Error("You must be logged in!");
  }

  return await db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: true,
    },
  });
}

export async function getBuyerOrders(userId: string) {
  if (!userId) {
    throw new Error("You must be logged in!");
  }

  // First, get all orders for this user
  const orders = await db.order.findMany({
    where: { userId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: true,
    },
  });

  // Then, for each order, get the seller information separately
  const ordersWithSellers = await Promise.all(
    orders.map(async (order) => {
      try {
        // Find the seller by userId (which is stored in sellerId field of the order)
        const seller = await db.seller.findFirst({
          where: { userId: order.sellerId },
          select: {
            userId: true,
            shopName: true,
            id: true,
          },
        });

        return {
          ...order,
          seller: seller || { userId: order.sellerId, shopName: "Unknown Seller", id: order.sellerId },
        };
      } catch (error) {
        console.error(`Error fetching seller for order ${order.id}:`, error);
        return {
          ...order,
          seller: { userId: order.sellerId, shopName: "Unknown Seller", id: order.sellerId },
        };
      }
    })
  );

  return ordersWithSellers;
}

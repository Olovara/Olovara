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

  // Get all orders for this user without including the seller relation
  const orders = await db.order.findMany({
    where: { userId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: true,
    },
  });

  // Map the orders to include a seller object with the shopName from the order
  const ordersWithSellers = orders.map(order => {
    // Use type assertion to access the shopName property
    const orderWithShopName = order as any;
    
    return {
      ...order,
      seller: {
        id: order.sellerId,
        userId: order.sellerId,
        shopName: orderWithShopName.shopName || "Unknown Seller"
      }
    };
  });

  return ordersWithSellers;
}

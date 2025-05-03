import { db } from "@/lib/db";

export async function getSellerOrders(userId: string) {
  if (!userId) {
    throw new Error("You must be logged in!");
  }

  // First get the seller's ID from their userId
  const seller = await db.seller.findUnique({
    where: { userId },
    select: { id: true }
  });

  if (!seller) {
    throw new Error("Seller not found!");
  }

  return await db.order.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: true,
    },
  }).then(orders => orders.map(order => ({
    ...order,
    buyerName: order.buyerName || 'Anonymous',
    buyerEmail: order.buyerEmail || '',
    seller: {
      id: order.sellerId,
      userId: order.sellerId,
      shopName: order.shopName || "Unknown Seller"
    }
  })));
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

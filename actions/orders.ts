"use server";

import { db } from "@/lib/db";
import { decryptName } from "@/lib/encryption";

export async function getSellerOrders(userId: string) {
  if (!userId) {
    throw new Error("You must be logged in!");
  }
  try {
    // First find the seller
    const seller = await db.seller.findUnique({
      where: { userId },
      select: { id: true },
    });

    console.log("Found seller:", seller);

    if (!seller) {
      console.log("No seller found for userId:", userId);
      return [];
    }

    // Then find the orders
    const orders = await db.order.findMany({
      where: { sellerId: seller.id },
      select: {
        id: true,
        userId: true,
        sellerId: true,
        shopName: true,
        productId: true,
        productName: true,
        quantity: true,
        totalAmount: true,
        productPrice: true,
        shippingCost: true,
        stripeFee: true,
        isDigital: true,
        status: true,
        paymentStatus: true,
        stripeSessionId: true,
        stripeTransferId: true,
        encryptedBuyerEmail: true,
        buyerEmailIV: true,
        encryptedBuyerName: true,
        buyerNameIV: true,
        encryptedShippingAddress: true,
        shippingAddressIV: true,
        discount: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        product: {
          select: {
            name: true,
            images: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("Found orders:", orders);

    // Decrypt sensitive data
    return orders.map(order => ({
      ...order,
      buyerEmail: decryptName(order.encryptedBuyerEmail, order.buyerEmailIV),
      buyerName: decryptName(order.encryptedBuyerName, order.buyerNameIV),
      shippingAddress: order.encryptedShippingAddress 
        ? JSON.parse(decryptName(order.encryptedShippingAddress, order.shippingAddressIV))
        : null,
    }));
  } catch (error) {
    console.error("Error getting seller orders:", error);
    return [];
  }
}

export async function getBuyerOrders(userId: string) {
  try {
    const orders = await db.order.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            name: true,
            images: true,
          },
        },
        seller: {
          select: {
            id: true,
            userId: true,
            shopName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Decrypt sensitive data
    return orders.map(order => ({
      ...order,
      buyerEmail: decryptName(order.encryptedBuyerEmail, order.buyerEmailIV),
      buyerName: decryptName(order.encryptedBuyerName, order.buyerNameIV),
      shippingAddress: order.encryptedShippingAddress 
        ? JSON.parse(decryptName(order.encryptedShippingAddress, order.shippingAddressIV))
        : null,
    }));
  } catch (error) {
    console.error("Error getting buyer orders:", error);
    return [];
  }
}

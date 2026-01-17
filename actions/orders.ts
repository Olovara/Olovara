"use server";

import { db } from "@/lib/db";
import { decryptData } from "@/lib/encryption";

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

    // Then find the orders using the seller's id
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
        buyerEmailSalt: true,
        encryptedBuyerName: true,
        buyerNameIV: true,
        buyerNameSalt: true,
        encryptedShippingAddress: true,
        shippingAddressIV: true,
        shippingAddressSalt: true,
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
    return orders.map((order) => ({
      ...order,
      buyerEmail: decryptData(
        order.encryptedBuyerEmail,
        order.buyerEmailIV,
        order.buyerEmailSalt
      ),
      buyerName: decryptData(
        order.encryptedBuyerName,
        order.buyerNameIV,
        order.buyerNameSalt
      ),
      shippingAddress:
        order.encryptedShippingAddress && order.shippingAddressSalt
          ? JSON.parse(
              decryptData(
                order.encryptedShippingAddress,
                order.shippingAddressIV,
                order.shippingAddressSalt
              )
            )
          : null,
    }));
  } catch (error) {
    console.error("Error getting seller orders:", error);
    return [];
  }
}

export async function getBuyerOrders(userId: string) {
  try {
    console.log("[DEBUG] Looking up orders for userId:", userId);

    const orders = await db.order.findMany({
      where: { userId },
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
        buyerEmailSalt: true,
        encryptedBuyerName: true,
        buyerNameIV: true,
        buyerNameSalt: true,
        encryptedShippingAddress: true,
        shippingAddressIV: true,
        shippingAddressSalt: true,
        discount: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        orderInstructions: true, // Include order instructions
        batchNumber: true, // Include batch number
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

    console.log("[DEBUG] Found orders:", orders);

    // Decrypt sensitive data
    return orders.map((order) => ({
      ...order,
      buyerEmail: decryptData(
        order.encryptedBuyerEmail,
        order.buyerEmailIV,
        order.buyerEmailSalt
      ),
      buyerName: decryptData(
        order.encryptedBuyerName,
        order.buyerNameIV,
        order.buyerNameSalt
      ),
      shippingAddress:
        order.encryptedShippingAddress && order.shippingAddressSalt
          ? JSON.parse(
              decryptData(
                order.encryptedShippingAddress,
                order.shippingAddressIV,
                order.shippingAddressSalt
              )
            )
          : null,
    }));
  } catch (error) {
    console.error("Error getting buyer orders:", error);
    return [];
  }
}
